Page({
  data: {
    total: 0.00,
    bills: [],
    token: '',
    userId: ''
  },

  onLoad() {
    console.log('index3 onLoad');
    this.checkAndLoadData();
  },

  onShow() {
    console.log('index3 onShow');
    this.checkAndLoadData();
  },

  checkAndLoadData() {
    try {
      const token = wx.getStorageSync('token');
      const userId = wx.getStorageSync('user_id');
      
      console.log('Checking token and userId:', { token, userId });

      if (!token || !userId) {
        console.log('Missing token or userId');
        this.handleAuthError();
        return;
      }

      this.setData({
        token,
        userId
      }, () => {
        this.loadBills();
      });

    } catch (error) {
      console.error('Error in checkAndLoadData:', error);
      this.handleAuthError();
    }
  },

  // 重定向到登录页面
  redirectToLogin() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('user_id');
    
    wx.showToast({
      title: '请先登录',
      icon: 'none',
      success: () => {
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
    console.log('Loading bills with token:', this.data.token);
    
    const token = this.data.token;
    if (!token || typeof token !== 'string' || !token.trim()) {
      console.error('Invalid token:', token);
      this.handleAuthError();
      return;
    }
  
    let loadingShown = false;
    const loadingTimeout = setTimeout(() => {
      loadingShown = true;
      wx.showLoading({ 
        title: '加载中...',
        mask: true
      });
    }, 200);
  
    console.log('Sending request with token:', `Bearer ${token}`);
  
    wx.request({
      url: 'http://127.0.0.1:5000/api/bills',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token.trim(),
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('Bills response:', res);
        
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
          console.log('Token error:', res.data);
          this.handleAuthError(); // 修改这里，使用 handleAuthError 而不是 handleTokenError
        } else {
          wx.showToast({
            title: res.data.error || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('Request failed:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        clearTimeout(loadingTimeout);
        if (loadingShown) {
          wx.hideLoading();
        }
      }
    });
  },
  handleAuthError() {
    // 清除登录状态
    wx.removeStorageSync('token');
    wx.removeStorageSync('user_id');
    
    // 使用 showModal 替代 showToast，避免和 loading 冲突
    wx.showModal({
      title: '提示',
      content: '登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    });
  },

  // 删除账单
deleteBill(e) {
  const { id, index } = e.currentTarget.dataset;
  
  if (!id) {
    wx.showToast({
      title: '无效的账单ID',
      icon: 'none'
    });
    return;
  }

  wx.showModal({
    title: '确认删除',
    content: '是否确定删除该账单？',
    success: res => {
      if (res.confirm) {
        let loadingShown = false;
        const loadingTimeout = setTimeout(() => {
          loadingShown = true;
          wx.showLoading({ 
            title: '删除中...',
            mask: true
          });
        }, 200);

        console.log('Deleting bill:', { id, index });

        wx.request({
          url: `http://127.0.0.1:5000/api/bills?id=${id}`,
          method: 'DELETE',
          header: {
            'Authorization': 'Bearer ' + this.data.token.trim(),
            'Content-Type': 'application/json'
          },
          success: res => {
            console.log('Delete response:', res);
            
            if (res.statusCode === 200) {
              // 从本地列表中移除该账单
              const bills = [...this.data.bills];
              bills.splice(index, 1);
              
              // 重新计算总额
              const total = bills.reduce((sum, item) => 
                sum + parseFloat(item.amount), 0
              );
              
              this.setData({
                bills,
                total: total.toFixed(2)
              });

              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else if (res.statusCode === 401 || res.statusCode === 422) {
              this.handleAuthError();
            } else {
              wx.showToast({
                title: res.data.error || '删除失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('Delete request failed:', err);
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
          },
          complete: () => {
            clearTimeout(loadingTimeout);
            if (loadingShown) {
              wx.hideLoading();
            }
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