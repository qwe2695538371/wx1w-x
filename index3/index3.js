Page({
  data: {
    total: 0.00,
    bills: [],
    token: ''
  },

  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 检查登录状态并加载账单
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    wx.getStorage({
      key: 'token',
      success: res => {
        if (res.data) {
          this.setData({ token: res.data });
          this.loadBills();
        } else {
          this.redirectToLogin();
        }
      },
      fail: () => {
        this.redirectToLogin();
      }
    });
  },

  // 重定向到登录页面
  redirectToLogin() {
    wx.showToast({
      title: '请先登录',
      icon: 'none',
      success: () => {
        setTimeout(() => {
          wx.reLaunch({  // 使用 reLaunch 替代 navigateTo
            url: '/pages/index/index'
          });
        }, 1500);
      }
    });
  },

  // 加载账单数据
  loadBills() {
    wx.showLoading({ title: '加载中...' });
    
    wx.request({
      url: 'http://127.0.0.1:5000/api/bills',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.data.token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          const bills = res.data.map(bill => ({
            id: bill.id,
            category: bill.category,
            amount: Number(bill.amount),
            time: bill.timestamp.split('T')[0],
            icon: this.getCategoryIcon(bill.category)
          }));

          const total = bills.reduce((sum, item) => sum + item.amount, 0);
          
          this.setData({
            bills,
            total: total.toFixed(2)
          });
        } else if (res.statusCode === 422 || res.statusCode === 401) {
          // Token 无效或过期
          wx.removeStorage({ key: 'token' }); // 清除无效的 token
          this.redirectToLogin();
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('请求失败：', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 删除账单
  deleteBill(e) {
    const { id, index } = e.currentTarget.dataset;

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
              'Authorization': `Bearer ${this.data.token}`,
              'Content-Type': 'application/json'
            },
            success: res => {
              wx.hideLoading();
              
              if (res.statusCode === 200) {
                const bills = this.data.bills.filter((_, i) => i !== index);
                const total = bills.reduce((sum, item) => sum + item.amount, 0);
                
                this.setData({
                  bills,
                  total: total.toFixed(2)
                });

                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else if (res.statusCode === 422 || res.statusCode === 401) {
                // Token 无效或过期
                wx.removeStorage({ key: 'token' });
                this.redirectToLogin();
              } else {
                wx.showToast({
                  title: '删除失败',
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
      '交通': 'car',
      '购物': 'shopping',
      '娱乐': 'entertainment',
    };
    return iconMap[category] || 'other';
  },

  navigateToAddBill() {
    wx.navigateTo({
      url: '/pages/index4/index4'
    });
  }
});