Page({
  data: {
    total: 0.00,
    bills: [],
    token: '',
    userId: ''
  },

  onLoad() {
    this.initUserInfo();
  },

  onShow() {
    this.initUserInfo();
  },

  // 初始化用户信息并加载账单
  initUserInfo() {
    const token = wx.getStorageSync('token');
    const userId = wx.getStorageSync('user_id');
    
    if (token && userId) {
      this.setData({ 
        token,
        userId 
      }, () => {
        this.loadBills();
      });
    } else {
      this.redirectToLogin();
    }
  },

  // 重定向到登录页面
  redirectToLogin() {
    wx.showToast({
      title: '请先登录',
      icon: 'none',
      complete: () => {
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    });
  },

  // 加载账单数据
  loadBills() {
    wx.showLoading({ title: '加载中...' });
    
    // 修改这里：确保 Authorization header 格式正确
    wx.request({
      url: 'http://127.0.0.1:5000/api/bills',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + this.data.token,  // 注意空格
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          const bills = res.data.map(bill => ({
            id: bill.id,
            category: bill.category,
            amount: parseFloat(bill.amount).toFixed(2),
            time: new Date(bill.timestamp).toLocaleDateString(),
            icon: this.getCategoryIcon(bill.category)
          }));

          const total = bills.reduce((sum, item) => 
            sum + parseFloat(item.amount), 0
          );
          
          this.setData({
            bills,
            total: total.toFixed(2)
          });
        } else if (res.statusCode === 401 || res.statusCode === 422) {
          // Token失效，清除本地存储并重新登录
          wx.removeStorageSync('token');
          wx.removeStorageSync('user_id');
          this.redirectToLogin();
        } else {
          wx.showToast({
            title: res.data.error || '加载失败',
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

  // 删除账单
  deleteBill(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '是否确定删除该账单？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          wx.request({
            url: `http://127.0.0.1:5000/api/bills?id=${id}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${this.data.token}`
            },
            success: res => {
              wx.hideLoading();
              
              if (res.statusCode === 200) {
                // 重新加载账单列表以确保同步
                this.loadBills();
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else if (res.statusCode === 401 || res.statusCode === 422) {
                wx.removeStorageSync('token');
                wx.removeStorageSync('user_id');
                this.redirectToLogin();
              } else {
                wx.showToast({
                  title: res.data.error || '删除失败',
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
      }
    });
  },

  getCategoryIcon(category) {
    const iconMap = {
      '餐饮': 'food',
      '交通': 'transport',
      '购物': 'shopping',
      '医疗': 'medication',
      '学习': 'learning',
      '其他': 'other'
    };
    return iconMap[category] || 'other';
  },

  navigateToAddBill() {
    wx.navigateTo({
      url: '/pages/index4/index4'
    });
  }
});