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
    wx.login({
      success: res => {
        wx.request({
          url: 'http://127.0.0.1:5000/api/wx_login',
          method: 'POST',
          data: { code: res.code },
          success: res => {
            if (res.data.registered) {
              wx.navigateTo({ url: '/pages/index3/index3' })
            } else {
              wx.navigateTo({ 
                url: '/pages/index2/index2?openid=' + res.data.openid 
              })
            }
          }
        })
      }
    })
  },

  // 账号登录提交 [3,8](@ref)
  handleAccountLogin() {
    wx.request({
      url: 'http://127.0.0.1:5000/api/account_login',
      method: 'POST',
      data: {
        username: this.data.username,
        password: this.data.password
      },
      success: res => {
        if (res.data.success) {
          wx.setStorage({
            key: 'token',
            data: res.data.access_token
        })
          wx.navigateTo({ url: '/pages/index3/index3' })
        } else {
          wx.showToast({ title: '账号或密码错误', icon: 'none' })
        }
      }
    })
  }
})
