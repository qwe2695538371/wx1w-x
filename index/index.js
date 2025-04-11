Page({
  data: {
      username: '',
      password: '',
      isAccountBtnDisabled: true
  },

  onUsernameInput(e) {
      this.setData({ 
          username: e.detail.value.trim() 
      }, this.checkForm);
  },

  onPasswordInput(e) {
      this.setData({ 
          password: e.detail.value.trim() 
      }, this.checkForm);
  },

  checkForm() {
      const isValid = this.data.username.length > 0 
          && this.data.password.length > 0;
      this.setData({
          isAccountBtnDisabled: !isValid
      });
  },

  handleWechatLogin() {
      wx.showLoading({ title: '登录中...' });
      
      wx.login({
          success: res => {
              wx.request({
                  url: 'http://127.0.0.1:5000/api/wx_login',
                  method: 'POST',
                  data: { code: res.code },
                  success: res => {
                      wx.hideLoading();
                      if (res.data.success) {
                          if (res.data.registered) {
                              // 已注册用户
                              wx.setStorageSync('token', res.data.access_token);
                              wx.setStorageSync('user_id', res.data.user_id);
                              wx.redirectTo({ url: '/pages/index3/index3' });
                          } else {
                              // 未注册用户
                              wx.redirectTo({ 
                                  url: `/pages/index2/index2?openid=${res.data.openid}` 
                              });
                          }
                      } else {
                          wx.showToast({ 
                              title: res.data.message || '登录失败', 
                              icon: 'none' 
                          });
                      }
                  },
                  fail: () => {
                      wx.hideLoading();
                      wx.showToast({ 
                          title: '网络错误', 
                          icon: 'none' 
                      });
                  }
              });
          },
          fail: () => {
              wx.hideLoading();
              wx.showToast({ 
                  title: '微信登录失败', 
                  icon: 'none' 
              });
          }
      });
  },

  handleAccountLogin() {
      if (this.data.isAccountBtnDisabled) return;
      
      wx.showLoading({ title: '登录中...' });
      
      wx.request({
          url: 'http://127.0.0.1:5000/api/login',
          method: 'POST',
          data: {
              username: this.data.username,
              password: this.data.password
          },
          success: res => {
              wx.hideLoading();
              if (res.data.success) {
                  wx.setStorageSync('token', res.data.access_token);
                  wx.setStorageSync('user_id', res.data.user_id);
                  
                  wx.redirectTo({ url: '/pages/index3/index3' });
              } else {
                  wx.showToast({ 
                      title: res.data.message || '登录失败', 
                      icon: 'none' 
                  });
              }
          },
          fail: () => {
              wx.hideLoading();
              wx.showToast({ 
                  title: '网络错误', 
                  icon: 'none' 
              });
          }
      });
  }
});