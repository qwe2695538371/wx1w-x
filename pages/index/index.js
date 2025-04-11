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

  onLoad() {
    // 清除旧的登录状态
    wx.removeStorageSync('token');
    wx.removeStorageSync('user_id');
  },

  // 微信一键登录
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
            console.log('wx_login response:', res); // 添加日志

            if (res.data.success) {
              if (res.data.registered) {
                // 已注册用户
                this.saveLoginState(res.data.access_token, res.data.user_id);
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
          fail: err => {
            console.error('Request failed:', err); // 添加日志
            wx.hideLoading();
            wx.showToast({ 
              title: '网络错误', 
              icon: 'none' 
            });
          }
        });
      },
      fail: err => {
        console.error('wx.login failed:', err); // 添加日志
        wx.hideLoading();
        wx.showToast({ 
          title: '微信登录失败', 
          icon: 'none' 
        });
      }
    });
  },

  // 保存登录状态
  saveLoginState(token, userId) {
    try {
      // 严格的类型检查和转换
      if (!token || !userId) {
        console.error('Invalid token or userId:', { token, userId });
        return false;
      }
  
      // 确保都是字符串类型
      const tokenStr = String(token).trim();
      const userIdStr = String(userId).trim();
  
      if (!tokenStr || !userIdStr) {
        console.error('Empty token or userId after conversion');
        return false;
      }
  
      console.log('Saving login state:', { token: tokenStr, userId: userIdStr });
  
      // 清除旧数据
      try {
        wx.removeStorageSync('token');
        wx.removeStorageSync('user_id');
      } catch (e) {
        console.error('Error clearing old data:', e);
      }
  
      // 保存新数据
      try {
        wx.setStorageSync('token', tokenStr);
        wx.setStorageSync('user_id', userIdStr);
  
        // 验证
        const savedToken = wx.getStorageSync('token');
        const savedUserId = wx.getStorageSync('user_id');
  
        const isSuccess = savedToken === tokenStr && savedUserId === userIdStr;
        console.log('Verification result:', { 
          isSuccess, 
          savedToken, 
          savedUserId,
          originalToken: tokenStr,
          originalUserId: userIdStr
        });
  
        return isSuccess;
      } catch (e) {
        console.error('Error saving new data:', e);
        return false;
      }
    } catch (error) {
      console.error('Fatal error in saveLoginState:', error);
      return false;
    }
  },

  // 账号登录
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
        console.log('login response:', res); // 添加日志

        if (res.data.success) {
          this.saveLoginState(res.data.access_token, res.data.user_id);
          wx.redirectTo({ url: '/pages/index3/index3' });
        } else {
          wx.showToast({ 
            title: res.data.message || '登录失败', 
            icon: 'none' 
          });
        }
      },
      fail: err => {
        console.error('Request failed:', err); // 添加日志
        wx.hideLoading();
        wx.showToast({ 
          title: '网络错误', 
          icon: 'none' 
        });
      }
    });
  },
});