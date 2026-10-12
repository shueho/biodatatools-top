const toolCategories = [
    {
        zh: '基础绘图',
        en: 'Basic Plots',
        subcategories: [
            {
                zh: '饼图',
                en: 'Pie Chart',
                tools: [
                    { id: '001', zh: '平面饼图/环形图', en: 'Flat Pie / Donut Chart' },
                    { id: '002', zh: '华夫饼图', en: 'Waffle Chart' },
                    { id: '003', zh: '雷达图', en: 'Radar Chart' },
                    { id: '004', zh: '花瓣图', en: 'Petal Chart' },
                    { id: '006', zh: '同心环图', en: 'Concentric Ring Chart' }
                ]
            },
            {
                zh: '柱形图',
                en: 'Bar Chart',
                tools: [
                    { id: '005', zh: '径向条形图', en: 'Radial Bar Chart' },
                    { id: '007', zh: '分组柱形图（竖直）', en: 'Grouped Bar Chart (Vertical)' }
                ]
            },
            {
                zh: '箱线图',
                en: 'Box Plot',
                tools: [
                    { id: 'xxx', zh: '开发中', en: 'NULL' }
                ]
            },

            {
                zh: '散点图',
                en: 'Scatter Plot',
                tools: [
                    { id: 'xxx', zh: '开发中', en: 'NULL' }
                ]
            },
            {
                zh: '折线图',
                en: 'Line Chart',
                tools: [
                    { id: 'xxx', zh: '开发中', en: 'NULL' }
                ]
            }
        ]
    },

    {
        zh: '基础统计',
        en: 'Basic Statistics',
        tools: [
            { id: 's001', zh: '统计量计算器', en: 'Statistics Calculator' },
            { id: 'xxx', zh: '开发中', en: 'NULL' }
        ]
    },

    {
        zh: '其他分析',
        en: 'Other Analysis',
        subcategories: [
            {
                zh: '开发中',
                en: 'NULL',
                tools: [
                    { id: 'xxx', zh: '开发中', en: 'NULL' }
                ]
            }
        ]
    }
];