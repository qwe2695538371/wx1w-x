Page({
  data: {
    categories: [
      { name: '餐饮', icon: 'food' },
      { name: '交通', icon: 'transport' },
      { name: '购物', icon: 'shopping' },
      { name: '医疗', icon: 'medication' },
      { name: '学习', icon: 'learning' }
    ],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    selectedIndex: -1,
    fenlei: '',
    isDisabled: true,
    isSubmitting: false,
    token: ''
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({ url: '/pages/index/index' });
      return;
    }
    this.setData({ token });
  },

  onAmountInput(e) {
    let value = e.detail.value.trim();
    
    // 金额格式化
    if (value) {
      // 移除非数字和小数点
      value = value.replace(/[^\d.]/g, '');
      
      // 处理多个小数点
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // 限制小数位数
      if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }

    this.setData({ amount: value }, this.watchForm);
  },

  bindDateChange(e) {
    this.setData({
      date: e.detail.value
    }, this.watchForm);
  },

  selectCategory(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index,
      fenlei: this.data.categories[index].name
    }, this.watchForm);
  },

  watchForm() {
    const { selectedIndex, amount, date } = this.data;
    const isValid = 
      selectedIndex !== -1 && 
      amount && 
      parseFloat(amount) > 0 && 
      date;
    
    this.setData({ isDisabled: !isValid });
  },

  submitBill() {
    if (this.data.isDisabled || this.data.isSubmitting) return;
    
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        complete: () => {
          wx.redirectTo({ url: '/pages/index/index' });
        }
      });
      return;
    }
  
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '保存中...' });
  
    const billData = {
      category: this.data.fenlei,
      amount: parseFloat(this.data.amount),
      timestamp: new Date(this.data.date).toISOString()
    };
  
    wx.request({
      url: 'http://127.0.0.1:5000/api/bills',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      data: billData,
      success: res => {
        wx.hideLoading();
        
        if (res.statusCode === 201) {
          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 1500,
            complete: () => {
              setTimeout(() => {
                // 返回上一页并刷新
                const pages = getCurrentPages();
                const prevPage = pages[pages.length - 2];
                prevPage.loadBills(); // 刷新账单列表
                wx.navigateBack();
              }, 1500);
            }
          });
        } else if (res.statusCode === 401 || res.statusCode === 422) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('user_id');
          wx.redirectTo({ url: '/pages/index/index' });
        } else {
          wx.showToast({
            title: res.data.error || '添加失败',
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
      },
      complete: () => {
        this.setData({ isSubmitting: false });
      }
    });
  }
});