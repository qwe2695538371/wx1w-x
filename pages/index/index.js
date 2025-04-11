// index.js
Page({
    data: {
        username: '',
        password: '',
        isAccountBtnDisabled: true  // 初始禁用状态
      },

  // 用户名输入监听
  onUsernameInput(e) {
    this.setData({ 
      username: e.detail.value.trim() 
    }, this.checkForm);
  },

  // 密码输入监听
  onPasswordInput(e) {
    this.setData({ 
      password: e.detail.value.trim()
    }, this.checkForm);
  },

  // 表单校验方法
  checkForm() {
    const isValid = this.data.username.length > 0 
      && this.data.password.length > 0;
    this.setData({
      isAccountBtnDisabled: !isValid
    });
  },
  // 微信一键登录点击事件 [1,5](@ref)
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
            if (res.data.access_token) {
              // 保存token和user_id
              wx.setStorageSync('token', res.data.access_token);
              wx.setStorageSync('user_id', res.data.user_id);
              
              if (res.data.registered) {
                wx.navigateTo({ url: '/pages/index3/index3' });
              } else {
                wx.navigateTo({ 
                  url: `/pages/index2/index2?openid=${res.data.openid}` 
                });
              }
            } else {
              wx.showToast({ 
                title: '登录失败', 
                icon: 'none' 
              });
            }
          },
          fail: err => {
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

  // 账号登录提交 [3,8](@ref)
  handleAccountLogin() {
    // 添加加载状态
    wx.showLoading({ title: '登录中...' });
    
    wx.request({
      url: 'http://127.0.0.1:5000/api/login', // 修改为正确的登录接口
      method: 'POST',
      data: {
        username: this.data.username,
        password: this.data.password
      },
      success: res => {
        wx.hideLoading();
        if (res.data.access_token) {
          // 保存token和user_id
          wx.setStorageSync('token', res.data.access_token);
          wx.setStorageSync('user_id', res.data.user_id);
          
          wx.showToast({ 
            title: '登录成功', 
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.navigateTo({ url: '/pages/index3/index3' });
              }, 1500);
            }
          });
        } else {
          wx.showToast({ 
            title: res.data.msg || '登录失败', 
            icon: 'none' 
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ 
          title: '网络错误', 
          icon: 'none' 
        });
      }
    });
  }
})
