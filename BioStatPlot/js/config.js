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
                zh: '柱状图',
                en: 'Bar Chart',
                tools: [
                    { id: '005', zh: '径向条形图', en: 'Radial Bar Chart' },
                    { id: '007', zh: '分组柱状图', en: 'Grouped Bar Chart' },
                    { id: '008', zh: '分类柱状图', en: 'Categorized Bar Chart' },
                    { id: '009', zh: '堆积柱状图（带误差棒）', en: 'Stacked Bar Chart (with Error Bars)' },
                    { id: '010', zh: '堆积柱状图（宽表/丰度表）', en: 'Stacked Bar Chart (Wide / Abundance Table)' },
                    { id: '011', zh: '显著性柱状图', en: 'Significance Bar Chart' },
                    { id: '016', zh: '直方图', en: 'Histogram' },

                ]
            },
            {
                zh: '箱线图',
                en: 'Box Plot',
                tools: [
                    { id: '012', zh: '显著性箱线图', en: 'Significance Box Plot' },
                    { id: '013', zh: '显著性小提琴图', en: 'Significance Violin Plot' },
                    { id: '014', zh: '分裂小提琴图', en: 'Split Violin Plot' },
                    { id: '015', zh: '分面箱线图/小提琴图', en: 'Faceted Box / Violin Plot' },

                ]
            },

            {
                zh: '点图',
                en: 'Scatter Plot',
                tools: [
                    { id: '017', zh: '分组拟合散点图', en: 'Grouped Fit Scatter Plot' },
                    { id: '021', zh: '带误差棒的散点图', en: 'Scatter Plot with Error Bars' },

                ]
            },
            {
                zh: '线图',
                en: 'Line Chart',
                tools: [
                    { id: '018', zh: '分组折线图', en: 'Grouped Line Chart' },
                    { id: '019', zh: '哑铃图', en: 'Dumbbell Chart' },
                    { id: '020', zh: '棒棒糖图', en: 'Lollipop Chart' },

                ]
            },
            {
                zh: '热图',
                en: 'Heatmap',
                tools: [
                    { id: '022', zh: '相关性热图', en: 'Correlation Heatmap' },

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