Page({
  data: {
    username: '',
    password: '',
    openid: '',
    isSubmitting: false,
    passwordConfirm: '',
    isFormValid: false  // 添加表单验证状态
  },

  onLoad(options) {
    if (options.openid) {
      this.setData({ openid: options.openid });
    }
  },

  // 用户名输入监听
  onUsernameInput(e) {
    this.setData({ 
      username: e.detail.value.trim() 
    }, this.validateForm);  // 输入后验证表单
  },

  // 密码输入监听
  onPasswordInput(e) {
    this.setData({ 
      password: e.detail.value.trim() 
    }, this.validateForm);  // 输入后验证表单
  },

  // 确认密码输入监听
  onPasswordConfirmInput(e) {
    this.setData({ 
      passwordConfirm: e.detail.value.trim() 
    }, this.validateForm);  // 输入后验证表单
  },

  // 表单验证方法
  validateForm() {
    const { username, password, passwordConfirm } = this.data;
    
    const isValid = 
      username.length >= 3 && 
      password.length >= 8 && 
      password === passwordConfirm;

    this.setData({ isFormValid: isValid });
  },

  handleRegister() {
    const { 
      username, 
      password, 
      passwordConfirm,
      openid, 
      isSubmitting,
      isFormValid 
    } = this.data;
    
    if (isSubmitting || !isFormValid) return;
    
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '注册中...' });

    wx.request({
      url: 'http://127.0.0.1:5000/api/register',
      method: 'POST',
      data: { 
        username, 
        password, 
        openid 
      },
      success: res => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: '注册成功',
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
            title: res.data.message || '注册失败', 
            icon: 'none' 
          });
        }
      },
      fail: err => {
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