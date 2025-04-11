Page({
  data: {
      username: '',
      password: '',
      passwordConfirm: '',
      openid: '',
      isFormValid: false,
      isSubmitting: false
  },

  onLoad(options) {
      if (options.openid) {
          this.setData({ openid: options.openid });
      } else {
          wx.redirectTo({ url: '/pages/index/index' });
      }
  },

  onUsernameInput(e) {
      this.setData({ 
          username: e.detail.value.trim() 
      }, this.validateForm);
  },

  onPasswordInput(e) {
      this.setData({ 
          password: e.detail.value.trim() 
      }, this.validateForm);
  },

  onPasswordConfirmInput(e) {
      this.setData({ 
          passwordConfirm: e.detail.value.trim() 
      }, this.validateForm);
  },

  validateForm() {
      const { username, password, passwordConfirm } = this.data;
      
      const isValid = 
          username.length >= 3 && 
          password.length >= 8 && 
          password === passwordConfirm;

      this.setData({ isFormValid: isValid });
  },

  handleRegister() {
      if (!this.data.isFormValid || this.data.isSubmitting) return;
      
      this.setData({ isSubmitting: true });
      wx.showLoading({ title: '注册中...' });

      wx.request({
          url: 'http://127.0.0.1:5000/api/register',
          method: 'POST',
          data: { 
              username: this.data.username,
              password: this.data.password,
              openid: this.data.openid
          },
          success: res => {
              wx.hideLoading();
              if (res.data.success) {
                  wx.showToast({
                      title: '注册成功',
                      icon: 'success',
                      duration: 1500
                  });
                  
                  // 注册成功后直接登录
                  wx.request({
                      url: 'http://127.0.0.1:5000/api/login',
                      method: 'POST',
                      data: {
                          username: this.data.username,
                          password: this.data.password
                      },
                      success: loginRes => {
                          if (loginRes.data.success) {
                              wx.setStorageSync('token', loginRes.data.access_token);
                              wx.setStorageSync('user_id', loginRes.data.user_id);
                              wx.redirectTo({ url: '/pages/index3/index3' });
                          }
                      }
                  });
              } else {
                  wx.showToast({ 
                      title: res.data.message || '注册失败', 
                      icon: 'none' 
                  });
              }
          },
          fail: () => {
              wx.hideLoading();
              wx.showToast({
                  title: '网络错误，请稍后重试',
                  icon: 'none'
              });
          },
          complete: () => {
              this.setData({ isSubmitting: false });
          }
      });
  }
});