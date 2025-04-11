// pages/index4/index4.js
Page({
    data: {
      // 分类数据（需准备对应的png图标）
      categories: [
        { name: '餐饮', icon: 'food' },
        { name: '交通', icon: 'transport' },
        { name: '购物', icon: 'shopping' },
        { name: '医疗', icon: 'medication' },
        { name: '学习', icon: 'learning'}
      ],
      amount: '',       // 金额输入值
      date: '2025-04-09', // 默认当前日期
      selectedIndex: -1, // 新增选中索引
      fenlei: '',         // 新增选中分类名称
      isDisabled: true, // 初始禁用状态
      // 新增防抖标识
      isSubmitting: false 
    },
  
    // 金额输入处理[6](@ref)
    onAmountInput(e) {
      let value = e.detail.value
      // 过滤非数字和小数点
      value = value.replace(/[^0-9.]/g, '') 
      // 处理多个小数点
      const dotIndex = value.indexOf('.')
      if (dotIndex > -1) {
        value = value.substr(0, dotIndex + 1) + value.substr(dotIndex).replace(/\./g, '')
      }
      // 保留两位小数
      if (dotIndex > -1 && value.length - dotIndex > 3) {
        value = value.substring(0, dotIndex + 3)
      }
      this.setData({ amount: value })
      this.watchForm(); // 新增监听
    },
  
    // 提交记账
    submitBill() {
        if (this.data.isDisabled || this.data.isSubmitting) return;
        this.setData({ isSubmitting: true });
        
        // 构建新账单对象
        const newBill = {
          category: this.data.fenlei,
          amount: parseFloat(this.data.amount).toFixed(2),
          time: this.data.date,
          icon: this.data.categories[this.data.selectedIndex].icon // 提取对应图标
        };
        
        // 获取页面栈并更新前页数据
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2]; // 获取 index3 页面实例
        
        prevPage.setData({
          bills: [...prevPage.data.bills, newBill],
          total: (parseFloat(prevPage.data.total) + parseFloat(newBill.amount)).toFixed(2)
        });
        
        // 返回并提示
        wx.navigateBack({ delta: 1 });
        wx.showToast({ title: '记账成功', icon: 'success' });
        setTimeout(() => {
            this.setData({ isSubmitting: false });
          }, 1000);
        // 新增后端同步
    wx.request({
        url: 'http://127.0.0.1:5000/api/bills',
        method: 'POST',
        header: {
            'Authorization': `Bearer ${getApp().globalData.token}`
        },
        data: newBill,
        success: () => {
            // 本地更新逻辑不变...
        },
        fail: () => {
            wx.showToast({ title: '网络异常已缓存', icon: 'none' })
            this.cacheLocalData() // 网页7建议的离线缓存
        }
    })
      },
    bindDateChange(e) {
        this.setData({
          date: e.detail.value
        })
        // 可添加日期格式转换（如需要特殊格式）
        // this.formatDate(e.detail.value);
        this.watchForm(); // 新增监听
      },
      // 新增分类选择方法
  selectCategory(e) {
    const index = e.currentTarget.dataset.index;
    const selectedName = this.data.categories[index].name;
    
    this.setData({
      selectedIndex: index,
      fenlei: selectedName
    });
    this.watchForm(); // 新增监听
  },
  
    // 观察数据变化
  watchForm() {
    const isValid = this.data.selectedIndex !== -1 
      && this.data.fenlei 
      && this.data.amount 
      && this.data.date;
    this.setData({ isDisabled: !isValid });
  },
  })