Page({
  data: {
      total: 0.00,
      bills: [],
      token: '' // 添加token存储
  },

  onLoad() {
      // 从存储中获取token
      wx.getStorage({
          key: 'token',
          success: res => {
              this.setData({ token: res.data })
              this.loadBills()
          },
          fail: () => {
              wx.showToast({
                  title: '请先登录',
                  icon: 'none',
                  success: () => {
                      // 重定向到登录页面
                      wx.navigateTo({
                          url: '/pages/index/index'
                      })
                  }
              })
          }
      })
  },

  onShow() {
      if (this.data.token) {
          this.loadBills()
      }
  },

  // 加载账单数据
  loadBills() {
      wx.request({
          url: 'http://127.0.0.1:5000/api/bills',
          method: 'GET',
          header: {
              'Authorization': `Bearer ${this.data.token}`
          },
          success: res => {
              if (res.statusCode === 200) {
                  const bills = res.data.map(bill => ({
                      id: bill.id,
                      category: bill.category,
                      amount: Number(bill.amount),
                      time: bill.timestamp.split('T')[0],
                      icon: this.getCategoryIcon(bill.category)
                  }))

                  const total = bills.reduce((sum, item) => sum + item.amount, 0)
                  
                  this.setData({
                      bills,
                      total: total.toFixed(2)
                  })
              }
          },
          fail: () => {
              wx.showToast({
                  title: '加载失败',
                  icon: 'none'
              })
          }
      })
  },

  // 删除账单
  deleteBill(e) {
      const { id, index } = e.currentTarget.dataset

      wx.showModal({
          title: '确认删除',
          content: '是否确定删除该账单？',
          success: res => {
              if (res.confirm) {
                  wx.request({
                      url: `http://127.0.0.1:5000/api/bills?id=${id}`,
                      method: 'DELETE',
                      header: {
                          'Authorization': `Bearer ${this.data.token}`
                      },
                      success: res => {
                          if (res.statusCode === 200) {
                              const bills = this.data.bills.filter((_, i) => i !== index)
                              const total = bills.reduce((sum, item) => sum + item.amount, 0)
                              
                              this.setData({
                                  bills,
                                  total: total.toFixed(2)
                              })

                              wx.showToast({
                                  title: '删除成功',
                                  icon: 'success'
                              })
                          }
                      },
                      fail: () => {
                          wx.showToast({
                              title: '删除失败',
                              icon: 'none'
                          })
                      }
                  })
              }
          }
      })
  },

  // 获取分类图标
  getCategoryIcon(category) {
      const iconMap = {
          '餐饮': 'food',
          '交通': 'car',
          '购物': 'shopping',
          '娱乐': 'entertainment',
          // 添加更多分类图标映射
      }
      return iconMap[category] || 'other'
  },

  // 跳转到添加页面
  navigateToAddBill() {
      wx.navigateTo({
          url: '/pages/index4/index4'
      })
  }
})