Page({
  data: {
      username: '',
      password: '',
      openid: '',
      isSubmitting: false  // 防止重复提交
  },

  onLoad(options) {
      if (options.openid) {
          this.setData({ openid: options.openid })
      }
  },

  onUsernameInput(e) {
      this.setData({ username: e.detail.value.trim() })
  },

  onPasswordInput(e) {
      this.setData({ password: e.detail.value.trim() })
  },

  // 注册提交
  handleRegister() {
      const { username, password, openid, isSubmitting } = this.data
      
      // 防止重复提交
      if (isSubmitting) return
      
      // 前端基础验证
      if (!username || username.length < 3) {
          return wx.showToast({ 
              title: '用户名至少3位', 
              icon: 'none' 
          })
      }
      
      // 修改密码验证长度以匹配后端要求
      if (!password || password.length < 8) {
          return wx.showToast({ 
              title: '密码至少8位', 
              icon: 'none' 
          })
      }

      this.setData({ isSubmitting: true })

      wx.request({
          url: 'http://127.0.0.1:5000/api/register',
          method: 'POST',
          data: { 
              username, 
              password, 
              openid 
          },
          success: res => {
              if (res.statusCode === 201 && res.data.success) {
                  wx.showToast({
                      title: '注册成功',
                      icon: 'success',
                      duration: 2000,
                      success: () => {
                          // 延迟跳转，让用户看到成功提示
                          setTimeout(() => {
                              wx.navigateTo({ 
                                  url: '/pages/index3/index3'
                              })
                          }, 2000)
                      }
                  })
              } else {
                  wx.showToast({ 
                      title: res.data.message || '注册失败', 
                      icon: 'none' 
                  })
              }
          },
          fail: err => {
              wx.showToast({
                  title: '网络错误，请稍后重试',
                  icon: 'none'
              })
              console.error('注册请求失败:', err)
          },
          complete: () => {
              this.setData({ isSubmitting: false })
          }
      })
  }
})