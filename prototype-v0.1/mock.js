/* 榜单情报台 · 原型 V0.1 — 单一模拟数据源
   所有页面共享此数据，保证跨页一致；无真实后端。 */
window.MOCK = (() => {
  const platforms = { wechat_mini: '微信小游戏', douyin_mini: '抖音小游戏' };
  const boards = { hot: '热门榜', revenue: '畅销榜', new: '新游榜' };
  const sourceTypes = {
    official_original: '官方原始',
    article_citation: '公众号转述',
    manual: '人工整理'
  };

  const categoryTree = [
    {
      id: 'cat-1', name: '休闲益智', level: 1, count: 87, children: [
        {
          id: 'cat-11', name: '消除', level: 2, count: 43, children: [
            { id: 'cat-111', name: '三消', level: 3, count: 28 },
            { id: 'cat-112', name: '合成消除', level: 3, count: 9 },
            { id: 'cat-113', name: '连线消除', level: 3, count: 6 }
          ]
        },
        {
          id: 'cat-12', name: '合成', level: 2, count: 21, children: [
            { id: 'cat-121', name: '合成经营', level: 3, count: 12 },
            { id: 'cat-122', name: '纯合成', level: 3, count: 9 }
          ]
        },
        {
          id: 'cat-13', name: '解谜', level: 2, count: 23, children: [
            { id: 'cat-131', name: '物理解谜', level: 3, count: 11 },
            { id: 'cat-132', name: '找茬解谜', level: 3, count: 7 }
          ]
        }
      ]
    },
    {
      id: 'cat-2', name: '策略', level: 1, count: 54, children: [
        {
          id: 'cat-21', name: '塔防', level: 2, count: 23, children: [
            { id: 'cat-211', name: '放置塔防', level: 3, count: 15 },
            { id: 'cat-212', name: '传统塔防', level: 3, count: 9 }
          ]
        },
        {
          id: 'cat-22', name: '战争策略', level: 2, count: 18, children: [
            { id: 'cat-221', name: '生存SLG', level: 3, count: 11 },
            { id: 'cat-222', name: '国战SLG', level: 3, count: 7 }
          ]
        }
      ]
    },
    {
      id: 'cat-3', name: '模拟经营', level: 1, count: 50, children: [
        {
          id: 'cat-31', name: '经营养成', level: 2, count: 42, children: [
            { id: 'cat-311', name: '农场', level: 3, count: 14 },
            { id: 'cat-312', name: '餐厅', level: 3, count: 10 },
            { id: 'cat-313', name: '医院', level: 3, count: 4 },
            { id: 'cat-314', name: '小镇生活', level: 3, count: 14 }
          ]
        }
      ]
    },
    {
      id: 'cat-4', name: '角色扮演', level: 1, count: 38, children: [
        {
          id: 'cat-41', name: '放置RPG', level: 2, count: 33, children: [
            { id: 'cat-411', name: '挂机', level: 3, count: 18 },
            { id: 'cat-412', name: '卡牌放置', level: 3, count: 15 }
          ]
        }
      ]
    },
    {
      id: 'cat-5', name: '休闲竞技', level: 1, count: 29, children: [
        {
          id: 'cat-51', name: '派对', level: 2, count: 20, children: [
            { id: 'cat-511', name: '派对竞技', level: 3, count: 11 },
            { id: 'cat-512', name: 'io竞技', level: 3, count: 9 }
          ]
        }
      ]
    }
  ];

  const sources = [
    { id: 's1', name: '游戏葡萄', platforms: ['wechat_mini', 'douyin_mini'], weight: 5, status: 'active', note: '行业深度与观点', articles: 46 },
    { id: 's2', name: '罗斯基', platforms: ['wechat_mini', 'douyin_mini'], weight: 4, status: 'active', note: '榜单日更', articles: 38 },
    { id: 's3', name: 'DataEye', platforms: ['douyin_mini'], weight: 5, status: 'active', note: '数据机构榜单', articles: 29 },
    { id: 's4', name: '竞核', platforms: ['wechat_mini', 'douyin_mini'], weight: 4, status: 'active', note: '行业观察与访谈', articles: 22 },
    { id: 's5', name: '手游那点事', platforms: ['wechat_mini', 'douyin_mini'], weight: 3, status: 'active', note: '小游戏日报', articles: 31 },
    { id: 's6', name: '游戏那点事', platforms: ['wechat_mini'], weight: 3, status: 'active', note: '产品拆解', articles: 18 },
    { id: 's7', name: '独立出海联合体', platforms: ['wechat_mini', 'douyin_mini'], weight: 3, status: 'active', note: '出海视角', articles: 14 },
    { id: 's8', name: '小游戏观察', platforms: ['wechat_mini'], weight: 2, status: 'active', note: '榜单转述', articles: 25 },
    { id: 's9', name: '游戏日报', platforms: ['wechat_mini', 'douyin_mini'], weight: 2, status: 'paused', note: '更新不稳定', articles: 10 },
    { id: 's10', name: '游戏茶馆', platforms: ['wechat_mini', 'douyin_mini'], weight: 3, status: 'active', note: '行业资讯与访谈', articles: 16 },
    { id: 's11', name: 'GameLook', platforms: ['wechat_mini', 'douyin_mini'], weight: 4, status: 'active', note: '全球视野与产品分析', articles: 24 },
    { id: 's12', name: '游戏陀螺', platforms: ['wechat_mini', 'douyin_mini'], weight: 3, status: 'paused', note: '深度报道，更新不稳定', articles: 12 }
  ];

  const games = [
    {
      id: 'g1', name: '抓大鹅', short: '鹅', color: '#c98a5e',
      aliases: ['抓大鹅正版', '抓大鹅！'],
      publisher: '疯狂游戏', developer: '疯狂游戏', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2025-09-18', status: '运营中', isbn: false,
      categoryPath: ['休闲益智', '消除', '三消'], categorySource: 'ai', categoryConfidence: 0.92,
      firstSeen: '2026-09-02', lastSeen: '2026-10-16',
      stats: { currentRank: 1, bestRank: 1, daysOnBoard: 38, streak: 5 },
      quality: ['1 个别名待确认'], tags: ['消除', '社交裂变', 'IAA', '3D卡通', '成熟期']
    },
    {
      id: 'g2', name: '寻道大千', short: '寻', color: '#7b9e87',
      aliases: ['寻道大千-官方版'],
      publisher: '三七互娱', developer: '三七互娱', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2023-11-06', status: '运营中', isbn: true,
      categoryPath: ['角色扮演', '放置RPG', '卡牌放置'], categorySource: 'human', categoryConfidence: 0.98,
      firstSeen: '2026-08-14', lastSeen: '2026-10-16',
      stats: { currentRank: 2, bestRank: 1, daysOnBoard: 62, streak: 9 },
      quality: [], tags: ['放置', '卡牌', 'IAP', '仙侠', '成熟期']
    },
    {
      id: 'g3', name: '向僵尸开炮', short: '炮', color: '#b0736a',
      aliases: ['向僵尸开炮-末日'],
      publisher: '大梦龙途', developer: '大梦龙途', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2024-06-21', status: '运营中', isbn: true,
      categoryPath: ['策略', '塔防', '放置塔防'], categorySource: 'human', categoryConfidence: 0.96,
      firstSeen: '2026-08-03', lastSeen: '2026-10-16',
      stats: { currentRank: 3, bestRank: 2, daysOnBoard: 55, streak: 7 },
      quality: [], tags: ['塔防', '末日', '混合变现', '3D卡通', '成熟期']
    },
    {
      id: 'g4', name: '无尽冬日', short: '冬', color: '#6f8fa8',
      aliases: [],
      publisher: '点点互动', developer: '点点互动', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2024-03-15', status: '运营中', isbn: true,
      categoryPath: ['策略', '战争策略', '生存SLG'], categorySource: 'human', categoryConfidence: 0.97,
      firstSeen: '2026-07-20', lastSeen: '2026-10-16',
      stats: { currentRank: 1, bestRank: 1, daysOnBoard: 71, streak: 12 },
      quality: [], tags: ['SLG', '生存', 'IAP', '写实', '成熟期']
    },
    {
      id: 'g5', name: '这城有良田', short: '田', color: '#b99a5b',
      aliases: ['这城有良田之田园生活'],
      publisher: '益世界', developer: '益世界', platforms: ['wechat_mini'],
      release: '2024-09-10', status: '运营中', isbn: true,
      categoryPath: ['模拟经营', '经营养成', '农场'], categorySource: 'human', categoryConfidence: 0.95,
      firstSeen: '2026-08-09', lastSeen: '2026-10-16',
      stats: { currentRank: 4, bestRank: 3, daysOnBoard: 44, streak: 3 },
      quality: [], tags: ['经营', '田园', '混合变现', '2D手绘', '成长期']
    },
    {
      id: 'g6', name: '羊了个羊', short: '羊', color: '#8d9a78',
      aliases: [],
      publisher: '简游科技', developer: '简游科技', platforms: ['wechat_mini'],
      release: '2022-09-08', status: '运营中', isbn: false,
      categoryPath: ['休闲益智', '消除', '三消'], categorySource: 'human', categoryConfidence: 0.99,
      firstSeen: '2026-09-19', lastSeen: '2026-10-16',
      stats: { currentRank: 5, bestRank: 1, daysOnBoard: 29, streak: 1 },
      quality: [], tags: ['消除', '社交裂变', 'IAA', '2D手绘', '成熟期']
    },
    {
      id: 'g7', name: '国王指意', short: '王', color: '#a58a6f',
      aliases: [],
      publisher: '星辉游戏', developer: '星辉游戏', platforms: ['douyin_mini'],
      release: '2025-06-12', status: '运营中', isbn: true,
      categoryPath: ['策略', '塔防', null], categorySource: 'ai', categoryConfidence: 0.74,
      firstSeen: '2026-09-21', lastSeen: '2026-10-16',
      stats: { currentRank: 2, bestRank: 2, daysOnBoard: 26, streak: 4 },
      quality: ['L3 品类待补'], tags: ['塔防', '中世纪', 'IAP', '3D卡通', '成长期']
    },
    {
      id: 'g8', name: '冒险者日记', short: '冒', color: '#7e9b9a',
      aliases: [],
      publisher: '蓝飞互娱', developer: '蓝飞互娱', platforms: ['douyin_mini'],
      release: '2025-08-30', status: '运营中', isbn: false,
      categoryPath: ['角色扮演', '放置RPG', '挂机'], categorySource: 'ai', categoryConfidence: 0.86,
      firstSeen: '2026-09-28', lastSeen: '2026-10-16',
      stats: { currentRank: 3, bestRank: 2, daysOnBoard: 19, streak: 2 },
      quality: ['抖音榜暂未官方核对'], tags: ['放置', '冒险', '混合变现', '像素', '新游']
    },
    {
      id: 'g9', name: '开心消消乐', short: '乐', color: '#c08b5f',
      aliases: ['开心消消乐-经典版'],
      publisher: '乐元素', developer: '乐元素', platforms: ['wechat_mini'],
      release: '2014-02-14', status: '运营中', isbn: true,
      categoryPath: ['休闲益智', '消除', '三消'], categorySource: 'human', categoryConfidence: 0.99,
      firstSeen: '2026-07-01', lastSeen: '2026-10-16',
      stats: { currentRank: 6, bestRank: 5, daysOnBoard: 60, streak: 0 },
      quality: [], tags: ['消除', '长线', 'IAP', '2D卡通', '成熟期']
    },
    {
      id: 'g10', name: '元梦之星', short: '元', color: '#7c8fa8',
      aliases: [],
      publisher: '腾讯', developer: '天美工作室群', platforms: ['wechat_mini'],
      release: '2023-12-15', status: '运营中', isbn: true,
      categoryPath: ['休闲竞技', '派对', '派对竞技'], categorySource: 'human', categoryConfidence: 0.97,
      firstSeen: '2026-08-01', lastSeen: '2026-10-16',
      stats: { currentRank: 7, bestRank: 4, daysOnBoard: 33, streak: 0 },
      quality: [], tags: ['派对', '社交', 'IAP', '3D卡通', '成熟期']
    },
    {
      id: 'g11', name: '心动小镇', short: '心', color: '#9a8f7a',
      aliases: [],
      publisher: '心动网络', developer: '心动网络', platforms: ['wechat_mini'],
      release: '2025-10-02', status: '运营中', isbn: true,
      categoryPath: ['模拟经营', '经营养成', null], categorySource: 'ai', categoryConfidence: 0.68,
      firstSeen: '2026-10-15', lastSeen: '2026-10-16',
      stats: { currentRank: 8, bestRank: 8, daysOnBoard: 2, streak: 2 },
      quality: ['L3 品类待补', '品类归属存在争议'], tags: ['经营', '小镇', '社交', 'IAP', '新游']
    },
    {
      id: 'g12', name: '解压拧螺丝', short: '拧', color: '#8a9a8b',
      aliases: [],
      publisher: '风眼科技', developer: '风眼科技', platforms: ['wechat_mini'],
      release: '2025-09-25', status: '运营中', isbn: false,
      categoryPath: ['休闲益智', '解谜', '物理解谜'], categorySource: 'ai', categoryConfidence: 0.9,
      firstSeen: '2026-10-16', lastSeen: '2026-10-16',
      stats: { currentRank: 10, bestRank: 10, daysOnBoard: 1, streak: 1 },
      quality: [], tags: ['解谜', '解压', 'IAA', '3D写实', '新游']
    },
    {
      id: 'g13', name: '肥鹅健身房', short: '肥', color: '#a88f6d',
      aliases: [],
      publisher: '豪腾嘉科', developer: '豪腾嘉科', platforms: ['wechat_mini'],
      release: '2025-07-18', status: '运营中', isbn: false,
      categoryPath: ['休闲益智', '合成', '合成经营'], categorySource: 'human', categoryConfidence: 0.94,
      firstSeen: '2026-10-16', lastSeen: '2026-10-16',
      stats: { currentRank: 9, bestRank: 9, daysOnBoard: 1, streak: 1 },
      quality: [], tags: ['合成', '经营', 'IAA', '2D卡通', '新游']
    },
    {
      id: 'g14', name: '躺平发育', short: '躺', color: '#7f8c7a',
      aliases: [],
      publisher: '微游时代', developer: '微游时代', platforms: ['douyin_mini'],
      release: '2024-05-09', status: '运营中', isbn: false,
      categoryPath: ['策略', '塔防', '传统塔防'], categorySource: 'human', categoryConfidence: 0.93,
      firstSeen: '2026-08-22', lastSeen: '2026-10-16',
      stats: { currentRank: 7, bestRank: 4, daysOnBoard: 24, streak: 0 },
      quality: [], tags: ['塔防', '魔性', 'IAA', '2D卡通', '成熟期']
    },
    {
      id: 'g15', name: '咸鱼之王', short: '咸', color: '#b07a5d',
      aliases: ['咸鱼之王-官方版'],
      publisher: '豪腾嘉科', developer: '豪腾嘉科', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2023-08-17', status: '运营中', isbn: true,
      categoryPath: ['角色扮演', '放置RPG', '卡牌放置'], categorySource: 'human', categoryConfidence: 0.96,
      firstSeen: '2026-08-11', lastSeen: '2026-10-16',
      stats: { currentRank: 11, bestRank: 8, daysOnBoard: 52, streak: 3 },
      quality: [], tags: ['放置', '卡牌', 'IAP', '三国', '成熟期']
    },
    {
      id: 'g16', name: '疯狂骑士团', short: '骑', color: '#8d7f6a',
      aliases: [],
      publisher: '疯狂游戏', developer: '疯狂游戏', platforms: ['wechat_mini'],
      release: '2024-01-12', status: '运营中', isbn: true,
      categoryPath: ['角色扮演', '放置RPG', '挂机'], categorySource: 'human', categoryConfidence: 0.94,
      firstSeen: '2026-08-18', lastSeen: '2026-10-16',
      stats: { currentRank: 20, bestRank: 12, daysOnBoard: 41, streak: 0 },
      quality: [], tags: ['放置', '挂机', '混合变现', '3D卡通', '成熟期']
    },
    {
      id: 'g17', name: '动物餐厅', short: '动', color: '#b59a72',
      aliases: ['动物餐厅：治愈小店'],
      publisher: '两英里科技', developer: '两英里科技', platforms: ['wechat_mini'],
      release: '2023-04-20', status: '运营中', isbn: false,
      categoryPath: ['模拟经营', '经营养成', '餐厅'], categorySource: 'human', categoryConfidence: 0.95,
      firstSeen: '2026-09-06', lastSeen: '2026-10-16',
      stats: { currentRank: 12, bestRank: 6, daysOnBoard: 48, streak: 2 },
      quality: [], tags: ['经营', '治愈', 'IAA', '2D手绘', '成熟期']
    },
    {
      id: 'g18', name: '蛋仔派对', short: '蛋', color: '#c08f7a',
      aliases: ['蛋仔派对-欢乐季'],
      publisher: '网易', developer: '网易', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2024-02-02', status: '运营中', isbn: true,
      categoryPath: ['休闲竞技', '派对', '派对竞技'], categorySource: 'human', categoryConfidence: 0.97,
      firstSeen: '2026-08-05', lastSeen: '2026-10-16',
      stats: { currentRank: 13, bestRank: 8, daysOnBoard: 55, streak: 1 },
      quality: [], tags: ['派对', '社交', 'IAP', '3D卡通', '成熟期']
    },
    {
      id: 'g19', name: '贪吃蛇大作战', short: '蛇', color: '#7e9a86',
      aliases: ['贪吃蛇大作战正版'],
      publisher: '微派网络', developer: '微派网络', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2022-06-10', status: '运营中', isbn: false,
      categoryPath: ['休闲竞技', '派对', 'io竞技'], categorySource: 'human', categoryConfidence: 0.95,
      firstSeen: '2026-08-28', lastSeen: '2026-10-16',
      stats: { currentRank: 14, bestRank: 9, daysOnBoard: 36, streak: 0 },
      quality: [], tags: ['io', '竞技', 'IAA', '2D卡通', '成熟期']
    },
    {
      id: 'g20', name: '球球大作战', short: '球', color: '#7f91a8',
      aliases: ['球球大作战正版'],
      publisher: '巨人网络', developer: '巨人网络', platforms: ['wechat_mini'],
      release: '2022-03-18', status: '运营中', isbn: true,
      categoryPath: ['休闲竞技', '派对', 'io竞技'], categorySource: 'human', categoryConfidence: 0.96,
      firstSeen: '2026-09-12', lastSeen: '2026-10-16',
      stats: { currentRank: 18, bestRank: 10, daysOnBoard: 44, streak: 0 },
      quality: [], tags: ['io', '竞技', 'IAP', '2D卡通', '成熟期']
    },
    {
      id: 'g21', name: '三国吧兄弟', short: '三', color: '#a67d62',
      aliases: ['三国吧兄弟-塔防版'],
      publisher: '星辉游戏', developer: '星辉游戏', platforms: ['wechat_mini', 'douyin_mini'],
      release: '2025-07-08', status: '运营中', isbn: true,
      categoryPath: ['策略', '塔防', null], categorySource: 'ai', categoryConfidence: 0.71,
      firstSeen: '2026-09-30', lastSeen: '2026-10-16',
      stats: { currentRank: 15, bestRank: 12, daysOnBoard: 18, streak: 1 },
      quality: ['L3 品类待补'], tags: ['塔防', '三国', 'IAP', '写实', '成长期']
    },
    {
      id: 'g22', name: '我是大东家', short: '东', color: '#b08a5f',
      aliases: ['我是大东家-古风经营'],
      publisher: '益世界', developer: '益世界', platforms: ['wechat_mini'],
      release: '2025-09-12', status: '运营中', isbn: true,
      categoryPath: ['模拟经营', '经营养成', null], categorySource: 'ai', categoryConfidence: 0.73,
      firstSeen: '2026-10-16', lastSeen: '2026-10-16',
      stats: { currentRank: 16, bestRank: 16, daysOnBoard: 3, streak: 1 },
      quality: ['L3 品类待补'], tags: ['经营', '古风', '混合变现', '2D手绘', '新游']
    },
    {
      id: 'g23', name: '消消乐海滨假日', short: '滨', color: '#c08b70',
      aliases: [],
      publisher: '乐元素', developer: '乐元素', platforms: ['wechat_mini'],
      release: '2025-08-22', status: '运营中', isbn: true,
      categoryPath: ['休闲益智', '消除', '三消'], categorySource: 'human', categoryConfidence: 0.94,
      firstSeen: '2026-10-16', lastSeen: '2026-10-16',
      stats: { currentRank: 17, bestRank: 17, daysOnBoard: 2, streak: 1 },
      quality: [], tags: ['消除', 'IP', 'IAA', '2D卡通', '新游']
    },
    {
      id: 'g24', name: '乌冬的旅店', short: '乌', color: '#b09a7c',
      aliases: [],
      publisher: '两英里科技', developer: '两英里科技', platforms: ['wechat_mini'],
      release: '2025-06-30', status: '运营中', isbn: false,
      categoryPath: ['模拟经营', '经营养成', null], categorySource: 'ai', categoryConfidence: 0.69,
      firstSeen: '2026-10-14', lastSeen: '2026-10-16',
      stats: { currentRank: 19, bestRank: 19, daysOnBoard: 4, streak: 2 },
      quality: ['L3 品类待补'], tags: ['经营', '治愈', 'IAA', '2D手绘', '新游']
    }
  ];

  const articles = [
    {
      id: 'a1', sourceId: 's1', title: '抓大鹅重回第一，消除赛道又热了',
      url: 'https://mp.weixin.qq.com/s/demo-a1', publishedAt: '2026-10-16 08:12', fetchedAt: '2026-10-16 08:20',
      method: 'link', status: 'parsed', hash: '9f2c…a71e',
      body: [
        '10 月 16 日，微信小游戏热门榜出现了一次久违的换位。',
        '《抓大鹅》在连续两周徘徊于前五之后，重新回到榜首。截至发稿，这款由疯狂游戏发行的产品已经连续 5 天保持在前三。',
        '“抓大鹅这次回到榜首，靠的并不是买量，而是把两年前那套社交裂变重新跑通了。”一位接近项目组的从业者告诉游戏葡萄。',
        '与此同时，《寻道大千》退居第二。多名受访者认为，其本周素材投放的去重率下降，买量效率出现波动。',
        '消除赛道的另一款产品《羊了个羊》以新进身份回到第五。加上《开心消消乐》，微信热门榜前十中已有三款消除产品。',
        '“消除赛道的窗口期正在重新打开，抓大鹅与羊了个羊的同时回榜不是偶然。”上述从业者补充道。'
      ]
    },
    {
      id: 'a2', sourceId: 's2', title: '10月16日小游戏榜：抖音休闲新品集体上冲',
      url: 'https://mp.weixin.qq.com/s/demo-a2', publishedAt: '2026-10-16 09:05', fetchedAt: '2026-10-16 09:12',
      method: 'link', status: 'parsed', hash: '3bd1…0c88',
      body: [
        '今日微信小游戏热门榜前五与官方口径基本一致，抓大鹅、寻道大千、向僵尸开炮分列前三。',
        '抖音侧，休闲新品在国庆后集体上冲，国王指意稳居第二，冒险者日记进入前三。',
        '“寻道大千的素材疲劳已经很明显，本周投放素材的去重率不足三成。”一位投放负责人表示。',
        '“冒险者日记在国庆后的次留出现明显波动，长线表现仍需观察。”另一名发行运营提到。'
      ]
    },
    {
      id: 'a3', sourceId: 's3', title: '10月16日买量榜：末日题材继续霸榜',
      url: 'https://mp.weixin.qq.com/s/demo-a3', publishedAt: '2026-10-16 10:20', fetchedAt: '2026-10-16 10:24',
      method: 'link', status: 'failed', hash: null,
      failureReason: '正文抓取超时（30s），未获取到有效正文',
      body: []
    },
    {
      id: 'a4', sourceId: 's4', title: '微信小游戏畅销榜 10.16 截图',
      url: 'https://mp.weixin.qq.com/s/demo-a4', publishedAt: '2026-10-16 11:02', fetchedAt: '2026-10-16 11:02',
      method: 'screenshot', status: 'parsed', hash: 'ocr-7d2a',
      ocrConfidence: 0.86,
      body: [
        '（截图投喂）本文以榜单截图为主，OCR 已还原 4 条畅销榜记录。',
        '“心动小镇究竟算模拟经营还是休闲社交，行业里还没有统一口径。”配图说明中提到。'
      ]
    },
    {
      id: 'a5', sourceId: 's5', title: '小游戏日报：三款新品闯入抖音前十',
      url: 'https://mp.weixin.qq.com/s/demo-a5', publishedAt: '2026-10-16 12:30', fetchedAt: '2026-10-16 12:36',
      method: 'link', status: 'parsed', hash: 'c41b…9e02',
      body: [
        '抖音小游戏热门榜今日迎来三款新品，猪猪侠快跑与躺平发育分别位列第六、第七。',
        '头部方面，无尽冬日连续 12 天排名第一，国王指意与冒险者日记紧随其后。',
        '“塔防品类在抖音的竞争已经进入白热化阶段，头部三款产品的素材几乎同质化。”手游那点事在文中写道。'
      ]
    },
    {
      id: 'a6', sourceId: 's6', title: '《无尽冬日》连续 12 天霸榜的背后',
      url: 'https://mp.weixin.qq.com/s/demo-a6', publishedAt: '2026-10-15 20:10', fetchedAt: '2026-10-15 20:18',
      method: 'link', status: 'parsed', hash: 'a8f0…3d11',
      body: [
        '“无尽冬日连续 12 天霸榜，核心在于稳定的内容供给节奏。”一位接近点点互动的运营负责人表示。',
        '从版本节奏看，游戏保持了每两周一次小版本、每月一次大版本的更新频率。'
      ]
    },
    {
      id: 'a7', sourceId: 's7', title: '出海小游戏观察：合成赛道的机会',
      url: 'https://mp.weixin.qq.com/s/demo-a7', publishedAt: '2026-10-15 18:40', fetchedAt: '2026-10-15 18:48',
      method: 'link', status: 'parsed', hash: '77ce…b120',
      body: [
        '合成品类在海外小游戏市场保持增长，国内厂商的供给仍集中在少数几家公司。',
        '“合成经营类产品的长线留存优于纯合成，但前期买量成本更高。”文中提到。'
      ]
    },
    {
      id: 'a8', sourceId: 's8', title: '10月16日微信小游戏热门榜（转述）',
      url: 'https://mp.weixin.qq.com/s/demo-a8', publishedAt: '2026-10-16 13:15', fetchedAt: '2026-10-16 13:20',
      method: 'link', status: 'parsed', hash: 'd02a…45f9',
      body: [
        '“10 月以来，消除品类已经有 3 款新品进入微信热门榜前二十。”小游戏观察在榜单转述中写道。',
        '榜单前五与官方口径一致。'
      ]
    },
    {
      id: 'a9', sourceId: 's1', title: '小游戏周观察：模拟经营集体回暖',
      url: 'https://mp.weixin.qq.com/s/demo-a9', publishedAt: '2026-10-16 14:10', fetchedAt: '2026-10-16 14:18',
      method: 'link', status: 'parsed', hash: 'b71e…8c20',
      body: [
        '10 月以来，模拟经营品类在微信小游戏热门榜的存在感明显提升。',
        '“模拟经营品类本月明显回暖，餐厅与小镇题材贡献了主要增量。”游戏葡萄在周观察中写道。',
        '“古风经营题材在微信仍有稳定受众，新游首月留存普遍高于大盘。”',
        '不过，放置卡牌赛道的老产品仍在承压。“咸鱼之王的素材同质化严重，近期新增素材的点击率持续下滑。”一位投放从业者表示。'
      ]
    },
    {
      id: 'a10', sourceId: 's2', title: '10月16日抖音小游戏榜（转述）',
      url: 'https://mp.weixin.qq.com/s/demo-a10', publishedAt: '2026-10-16 09:40', fetchedAt: '2026-10-16 09:48',
      method: 'link', status: 'parsed', hash: 'ea03…17bd',
      body: [
        '10 月 16 日抖音小游戏热门榜与昨日相比，头部排名没有变化。',
        '无尽冬日、国王指意、冒险者日记继续占据前三，猪猪侠快跑位列第六且尚未完成游戏库映射。',
        '“抖音榜单的转述口径差异主要来自截图时间，建议以官方数据为准。”罗斯基在文末提示。'
      ]
    },
    {
      id: 'a11', sourceId: 's3', title: '微信小游戏畅销榜：无尽冬日升至第二',
      url: 'https://mp.weixin.qq.com/s/demo-a11', publishedAt: '2026-10-16 15:00', fetchedAt: '2026-10-16 15:07',
      method: 'link', status: 'parsed', hash: '1c6f…9a4e',
      body: [
        '微信小游戏畅销榜今日出现小幅换位，无尽冬日升至第二。',
        '寻道大千仍居第一，抓大鹅第三，心动小镇第四。',
        'DataEye 认为，畅销榜头部产品的版本节奏普遍进入稳定期。'
      ]
    },
    {
      id: 'a12', sourceId: 's4', title: '派对品类还能跑出新头部吗？',
      url: 'https://mp.weixin.qq.com/s/demo-a12', publishedAt: '2026-10-16 16:20', fetchedAt: '2026-10-16 16:31',
      method: 'link', status: 'parsed', hash: '5e91…2f80',
      body: [
        '派对品类在微信小游戏的增长正在放缓。',
        '“派对品类的新品窗口正在收窄，买量成本比去年高出近四成。”一位发行负责人告诉竞核。',
        '“io 竞技在抖音仍有低成本获量机会，关键是首局三秒内给出反馈。”另一名从业者认为。',
        '“球球大作战的用户结构正在老化，但核心盘仍然稳固。”'
      ]
    },
    {
      id: 'a13', sourceId: 's5', title: '10月16日微信小游戏新游榜',
      url: 'https://mp.weixin.qq.com/s/demo-a13', publishedAt: '2026-10-16 17:05', fetchedAt: '2026-10-16 17:12',
      method: 'link', status: 'parsed', hash: '7ad4…c118',
      body: [
        '10 月 16 日微信小游戏新游榜出现多款新品，我是大东家位列第一。',
        '消消乐海滨假日、贪吃蛇大作战、乌冬的旅店、蛋仔派对分列第二至第五。',
        '“三消新品如果只靠 IP 复刻，很难在微信形成新的长线头部。”手游那点事在文中提醒。'
      ]
    },
    {
      id: 'a14', sourceId: 's6', title: '动物餐厅的长线运营方法',
      url: 'https://mp.weixin.qq.com/s/demo-a14', publishedAt: '2026-10-15 21:10', fetchedAt: '2026-10-15 21:18',
      method: 'link', status: 'parsed', hash: '3f88…6d21',
      body: [
        '动物餐厅已经上线三年，仍然稳定在微信小游戏热门榜前二十。',
        '“动物餐厅的长线运营并不依赖高频买量，而是靠季节性内容维持回流。”游戏那点事在拆解中写道。',
        '文章认为，治愈系经营产品的核心是稳定的内容节奏，而不是短期买量。'
      ]
    },
    {
      id: 'a15', sourceId: 's7', title: '合成赛道观察：肥鹅健身房为什么能起量',
      url: 'https://mp.weixin.qq.com/s/demo-a15', publishedAt: '2026-10-15 19:20', fetchedAt: '2026-10-15 19:29',
      method: 'link', status: 'parsed', hash: '9b02…e4a7',
      body: [
        '合成品类在海外小游戏市场继续增长，肥鹅健身房是近期代表产品。',
        '“合成经营类产品的长线留存优于纯合成，但前期买量成本更高。”独立出海联合体写道。',
        '文章判断，合成赛道的窗口仍在，但产品供给正在快速增加。'
      ]
    },
    {
      id: 'a16', sourceId: 's8', title: '10月16日抖音小游戏热门榜（转述）',
      url: 'https://mp.weixin.qq.com/s/demo-a16', publishedAt: '2026-10-16 18:10', fetchedAt: '2026-10-16 18:18',
      method: 'link', status: 'parsed', hash: '4cd7…0b63',
      body: [
        '10 月 16 日抖音小游戏热门榜转述如下。',
        '无尽冬日、国王指意、冒险者日记继续位列前三，猪猪侠快跑第六。',
        '榜单截图来自公开渠道，名次以官方数据为准。'
      ]
    },
    {
      id: 'a17', sourceId: 's9', title: '10月16日小游戏买量观察',
      url: 'https://mp.weixin.qq.com/s/demo-a17', publishedAt: '2026-10-16 18:40', fetchedAt: '2026-10-16 18:44',
      method: 'link', status: 'failed', hash: null,
      failureReason: 'HTTP 403（访问被拒绝）',
      body: []
    },
    {
      id: 'a18', sourceId: 's4', title: '微信小游戏畅销榜截图 10.16 补充',
      url: 'https://mp.weixin.qq.com/s/demo-a18', publishedAt: '2026-10-16 19:02', fetchedAt: '2026-10-16 19:02',
      method: 'screenshot', status: 'needs_review', hash: 'ocr-64f1',
      ocrConfidence: 0.64,
      body: [
        '（截图投喂）OCR 识别出 4 条畅销榜记录，其中第 4 行置信度偏低，已进入待核队列。'
      ]
    }
  ];

  const observations = [
    // 微信热门 · 官方
    { id: 'o1', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 1, gameId: 'g1', rawName: '抓大鹅', sourceType: 'official_original', confidence: 1 },
    { id: 'o2', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 2, gameId: 'g2', rawName: '寻道大千', sourceType: 'official_original', confidence: 1 },
    { id: 'o3', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 3, gameId: 'g3', rawName: '向僵尸开炮', sourceType: 'official_original', confidence: 1 },
    { id: 'o4', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 4, gameId: 'g5', rawName: '这城有良田', sourceType: 'official_original', confidence: 1 },
    { id: 'o5', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 5, gameId: 'g6', rawName: '羊了个羊', sourceType: 'official_original', confidence: 1 },
    { id: 'o6', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 6, gameId: 'g9', rawName: '开心消消乐', sourceType: 'official_original', confidence: 1 },
    { id: 'o7', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 7, gameId: 'g10', rawName: '元梦之星', sourceType: 'official_original', confidence: 1 },
    { id: 'o8', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 8, gameId: 'g11', rawName: '心动小镇', sourceType: 'official_original', confidence: 1 },
    { id: 'o9', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 9, gameId: 'g13', rawName: '肥鹅健身房', sourceType: 'official_original', confidence: 1 },
    { id: 'o10', articleId: null, platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 10, gameId: 'g12', rawName: '解压拧螺丝', sourceType: 'official_original', confidence: 1 },
    // 微信热门 · 游戏葡萄转述
    { id: 'o11', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 2, gameId: 'g1', rawName: '抓大鹅正版', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o12', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 1, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o13', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 3, gameId: 'g3', rawName: '向僵尸开炮', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o14', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 4, gameId: 'g5', rawName: '这城有良田', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o15', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 6, gameId: 'g6', rawName: '羊了个羊', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o16', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 5, gameId: 'g9', rawName: '开心消消乐', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o17', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 7, gameId: 'g10', rawName: '元梦之星', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o18', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 8, gameId: 'g11', rawName: '心动小镇', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o19', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 9, gameId: 'g13', rawName: '肥鹅健身房', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o20', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 10, gameId: 'g12', rawName: '解压拧螺丝', sourceType: 'article_citation', confidence: 0.96 },
    // 微信热门 · 罗斯基转述
    { id: 'o21', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 1, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o22', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 2, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o23', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 3, gameId: 'g3', rawName: '向僵尸开炮', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o24', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 4, gameId: 'g5', rawName: '这城有良田', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o25', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 5, gameId: 'g6', rawName: '羊了个羊', sourceType: 'article_citation', confidence: 0.94 },
    // 抖音热门 · 转述
    { id: 'o31', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 1, gameId: 'g4', rawName: '无尽冬日', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o32', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 2, gameId: 'g7', rawName: '国王指意', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o33', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 3, gameId: 'g8', rawName: '冒险者日记', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o34', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 4, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o35', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 5, gameId: 'g3', rawName: '向僵尸开炮', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o36', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 6, gameId: null, rawName: '猪猪侠快跑', sourceType: 'article_citation', confidence: 0.82 },
    { id: 'o37', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 7, gameId: 'g14', rawName: '躺平发育', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o38', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 8, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.93 },
    // 畅销榜截图
    { id: 'o41', articleId: 'a4', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 1, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.84 },
    { id: 'o42', articleId: 'a4', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 2, gameId: 'g4', rawName: '无尽冬日', sourceType: 'article_citation', confidence: 0.84 },
    { id: 'o43', articleId: 'a4', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 3, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.84 },
    { id: 'o44', articleId: 'a4', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 4, gameId: 'g11', rawName: '心动小镇', sourceType: 'article_citation', confidence: 0.72 },
    // 抖音热门 · 手游那点事补充
    { id: 'o45', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 9, gameId: 'g15', rawName: '咸鱼之王', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o46', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 10, gameId: 'g19', rawName: '贪吃蛇大作战', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o47', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 11, gameId: 'g24', rawName: '乌冬的旅店', sourceType: 'article_citation', confidence: 0.93 },
    { id: 'o48', articleId: 'a5', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 12, gameId: 'g23', rawName: '消消乐海滨假日', sourceType: 'article_citation', confidence: 0.93 },
    // 抖音热门 · 罗斯基转述
    { id: 'o51', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 1, gameId: 'g4', rawName: '无尽冬日', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o52', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 2, gameId: 'g7', rawName: '国王指意', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o53', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 3, gameId: 'g8', rawName: '冒险者日记', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o54', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 4, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o55', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 5, gameId: 'g3', rawName: '向僵尸开炮', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o56', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 6, gameId: null, rawName: '猪猪侠快跑', sourceType: 'article_citation', confidence: 0.78 },
    { id: 'o57', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 7, gameId: 'g14', rawName: '躺平发育', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o58', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 8, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o59', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 9, gameId: 'g15', rawName: '咸鱼之王', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o60', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 10, gameId: 'g19', rawName: '贪吃蛇大作战', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o61', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 11, gameId: 'g24', rawName: '乌冬的旅店', sourceType: 'article_citation', confidence: 0.92 },
    { id: 'o62', articleId: 'a10', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 12, gameId: 'g23', rawName: '消消乐海滨假日', sourceType: 'article_citation', confidence: 0.92 },
    // 微信畅销 · DataEye
    { id: 'o63', articleId: 'a11', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 1, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.88 },
    { id: 'o64', articleId: 'a11', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 2, gameId: 'g4', rawName: '无尽冬日', sourceType: 'article_citation', confidence: 0.88 },
    { id: 'o65', articleId: 'a11', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 3, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.88 },
    { id: 'o66', articleId: 'a11', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 4, gameId: 'g11', rawName: '心动小镇', sourceType: 'article_citation', confidence: 0.88 },
    // 微信新游 · 手游那点事
    { id: 'o67', articleId: 'a13', platform: 'wechat_mini', board: 'new', date: '2026-10-16', rank: 1, gameId: 'g22', rawName: '我是大东家', sourceType: 'article_citation', confidence: 0.9 },
    { id: 'o68', articleId: 'a13', platform: 'wechat_mini', board: 'new', date: '2026-10-16', rank: 2, gameId: 'g23', rawName: '消消乐海滨假日', sourceType: 'article_citation', confidence: 0.9 },
    { id: 'o69', articleId: 'a13', platform: 'wechat_mini', board: 'new', date: '2026-10-16', rank: 3, gameId: 'g19', rawName: '贪吃蛇大作战', sourceType: 'article_citation', confidence: 0.9 },
    { id: 'o70', articleId: 'a13', platform: 'wechat_mini', board: 'new', date: '2026-10-16', rank: 4, gameId: 'g24', rawName: '乌冬的旅店', sourceType: 'article_citation', confidence: 0.9 },
    { id: 'o71', articleId: 'a13', platform: 'wechat_mini', board: 'new', date: '2026-10-16', rank: 5, gameId: 'g18', rawName: '蛋仔派对', sourceType: 'article_citation', confidence: 0.9 },
    // 抖音热门 · 小游戏观察
    { id: 'o72', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 1, gameId: 'g4', rawName: '无尽冬日', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o73', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 2, gameId: 'g7', rawName: '国王指意', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o74', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 3, gameId: 'g8', rawName: '冒险者日记', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o75', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 4, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o76', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 5, gameId: 'g3', rawName: '向僵尸开炮', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o77', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 6, gameId: null, rawName: '猪猪侠快跑', sourceType: 'article_citation', confidence: 0.74 },
    { id: 'o78', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 7, gameId: 'g14', rawName: '躺平发育', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o79', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 8, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o80', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 9, gameId: 'g15', rawName: '咸鱼之王', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o81', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 10, gameId: 'g19', rawName: '贪吃蛇大作战', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o82', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 11, gameId: 'g24', rawName: '乌冬的旅店', sourceType: 'article_citation', confidence: 0.89 },
    { id: 'o83', articleId: 'a16', platform: 'douyin_mini', board: 'hot', date: '2026-10-16', rank: 12, gameId: 'g23', rawName: '消消乐海滨假日', sourceType: 'article_citation', confidence: 0.89 },
    // 微信畅销 · 低置信截图
    { id: 'o84', articleId: 'a18', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 1, gameId: 'g2', rawName: '寻道大千', sourceType: 'article_citation', confidence: 0.64 },
    { id: 'o85', articleId: 'a18', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 2, gameId: 'g4', rawName: '无尽冬日', sourceType: 'article_citation', confidence: 0.64 },
    { id: 'o86', articleId: 'a18', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 3, gameId: 'g1', rawName: '抓大鹅', sourceType: 'article_citation', confidence: 0.64 },
    { id: 'o87', articleId: 'a18', platform: 'wechat_mini', board: 'revenue', date: '2026-10-16', rank: 4, gameId: 'g11', rawName: '心动小镇', sourceType: 'article_citation', confidence: 0.61 },
    // 微信热门 · 游戏葡萄补充 11-20
    { id: 'o88', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 11, gameId: 'g15', rawName: '咸鱼之王', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o89', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 12, gameId: 'g17', rawName: '动物餐厅', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o90', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 13, gameId: 'g18', rawName: '蛋仔派对', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o91', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 14, gameId: 'g19', rawName: '贪吃蛇大作战', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o92', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 15, gameId: 'g21', rawName: '三国吧兄弟', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o93', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 16, gameId: 'g22', rawName: '我是大东家', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o94', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 17, gameId: 'g23', rawName: '消消乐海滨假日', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o95', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 18, gameId: 'g20', rawName: '球球大作战', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o96', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 19, gameId: 'g24', rawName: '乌冬的旅店', sourceType: 'article_citation', confidence: 0.96 },
    { id: 'o97', articleId: 'a1', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 20, gameId: 'g16', rawName: '疯狂骑士团', sourceType: 'article_citation', confidence: 0.96 },
    // 微信热门 · 罗斯基补充 11-20
    { id: 'o98', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 11, gameId: 'g15', rawName: '咸鱼之王', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o99', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 12, gameId: 'g17', rawName: '动物餐厅', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o100', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 13, gameId: 'g18', rawName: '蛋仔派对', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o101', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 14, gameId: 'g19', rawName: '贪吃蛇大作战', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o102', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 15, gameId: 'g21', rawName: '三国吧兄弟', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o103', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 16, gameId: 'g22', rawName: '我是大东家', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o104', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 17, gameId: 'g23', rawName: '消消乐海滨假日', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o105', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 18, gameId: 'g20', rawName: '球球大作战', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o106', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 19, gameId: 'g24', rawName: '乌冬的旅店', sourceType: 'article_citation', confidence: 0.94 },
    { id: 'o107', articleId: 'a2', platform: 'wechat_mini', board: 'hot', date: '2026-10-16', rank: 20, gameId: 'g16', rawName: '疯狂骑士团', sourceType: 'article_citation', confidence: 0.94 }
  ];

  const claims = [
    { id: 'cl1', articleId: 'a1', subjectType: 'game', subjectId: 'g1', stance: 'positive', text: '抓大鹅的社交裂变设计重新跑通，返场成本极低', quote: '抓大鹅这次回到榜首，靠的并不是买量，而是把两年前那套社交裂变重新跑通了。', confidence: 0.88, status: 'confirmed', time: '2026-10-16 08:20' },
    { id: 'cl2', articleId: 'a2', subjectType: 'game', subjectId: 'g2', stance: 'negative', text: '寻道大千的素材疲劳已经很明显', quote: '寻道大千的素材疲劳已经很明显，本周投放素材的去重率不足三成。', confidence: 0.76, status: 'confirmed', time: '2026-10-16 09:12' },
    { id: 'cl3', articleId: 'a5', subjectType: 'game', subjectId: 'g3', stance: 'neutral', text: '塔防品类在抖音的竞争进入白热化', quote: '塔防品类在抖音的竞争已经进入白热化阶段，头部三款产品的素材几乎同质化。', confidence: 0.81, status: 'confirmed', time: '2026-10-16 12:36' },
    { id: 'cl4', articleId: 'a1', subjectType: 'category', subjectId: 'cat-11', stance: 'positive', text: '消除赛道的窗口期重新打开', quote: '消除赛道的窗口期正在重新打开，抓大鹅与羊了个羊的同时回榜不是偶然。', confidence: 0.72, status: 'confirmed', time: '2026-10-16 08:20' },
    { id: 'cl5', articleId: 'a2', subjectType: 'game', subjectId: 'g8', stance: 'negative', text: '冒险者日记的留存出现波动', quote: '冒险者日记在国庆后的次留出现明显波动，长线表现仍需观察。', confidence: 0.58, status: 'pending', time: '2026-10-16 09:12' },
    { id: 'cl6', articleId: 'a6', subjectType: 'game', subjectId: 'g4', stance: 'positive', text: '无尽冬日已形成稳定的内容供给节奏', quote: '无尽冬日连续 12 天霸榜，核心在于稳定的内容供给节奏。', confidence: 0.91, status: 'confirmed', time: '2026-10-15 20:18' },
    { id: 'cl7', articleId: 'a8', subjectType: 'category', subjectId: 'cat-1', stance: 'positive', text: '消除品类本月新进 3 款', quote: '10 月以来，消除品类已经有 3 款新品进入微信热门榜前二十。', confidence: 0.83, status: 'confirmed', time: '2026-10-16 13:20' },
    { id: 'cl8', articleId: 'a4', subjectType: 'game', subjectId: 'g11', stance: 'neutral', text: '心动小镇的品类归属存在争议', quote: '心动小镇究竟算模拟经营还是休闲社交，行业里还没有统一口径。', confidence: 0.64, status: 'pending', time: '2026-10-16 11:02' },
    { id: 'cl9', articleId: 'a14', subjectType: 'game', subjectId: 'g17', stance: 'positive', text: '动物餐厅靠季节性内容维持长线回流', quote: '动物餐厅的长线运营并不依赖高频买量，而是靠季节性内容维持回流。', confidence: 0.86, status: 'confirmed', time: '2026-10-15 21:18' },
    { id: 'cl10', articleId: 'a12', subjectType: 'game', subjectId: 'g18', stance: 'negative', text: '派对品类的新品窗口正在收窄', quote: '派对品类的新品窗口正在收窄，买量成本比去年高出近四成。', confidence: 0.74, status: 'confirmed', time: '2026-10-16 16:31' },
    { id: 'cl11', articleId: 'a12', subjectType: 'game', subjectId: 'g19', stance: 'positive', text: 'io 竞技在抖音仍有低成本获量机会', quote: 'io 竞技在抖音仍有低成本获量机会，关键是首局三秒内给出反馈。', confidence: 0.79, status: 'confirmed', time: '2026-10-16 16:31' },
    { id: 'cl12', articleId: 'a12', subjectType: 'game', subjectId: 'g20', stance: 'neutral', text: '球球大作战核心盘稳固但用户老化', quote: '球球大作战的用户结构正在老化，但核心盘仍然稳固。', confidence: 0.78, status: 'confirmed', time: '2026-10-16 16:31' },
    { id: 'cl13', articleId: 'a9', subjectType: 'game', subjectId: 'g22', stance: 'positive', text: '古风经营题材在微信仍有稳定受众', quote: '古风经营题材在微信仍有稳定受众，新游首月留存普遍高于大盘。', confidence: 0.84, status: 'confirmed', time: '2026-10-16 14:18' },
    { id: 'cl14', articleId: 'a9', subjectType: 'game', subjectId: 'g15', stance: 'negative', text: '咸鱼之王的素材同质化严重', quote: '咸鱼之王的素材同质化严重，近期新增素材的点击率持续下滑。', confidence: 0.61, status: 'pending', time: '2026-10-16 14:18' },
    { id: 'cl15', articleId: 'a9', subjectType: 'category', subjectId: 'cat-3', stance: 'positive', text: '模拟经营品类本月明显回暖', quote: '模拟经营品类本月明显回暖，餐厅与小镇题材贡献了主要增量。', confidence: 0.81, status: 'confirmed', time: '2026-10-16 14:18' },
    { id: 'cl16', articleId: 'a13', subjectType: 'game', subjectId: 'g23', stance: 'negative', text: '三消新品只靠 IP 复刻难以形成长线头部', quote: '三消新品如果只靠 IP 复刻，很难在微信形成新的长线头部。', confidence: 0.66, status: 'pending', time: '2026-10-16 17:12' }
  ];

  const rankings = {
    'wechat_mini:hot:2026-10-16': {
      platform: 'wechat_mini', board: 'hot', date: '2026-10-16', status: 'confirmed',
      official: {
        sourceName: '微信小游戏官方榜单', capturedAt: '2026-10-16 07:30', sourceType: 'official_original',
        entries: [
          { rank: 1, gameId: 'g1', trend: 'up', delta: 4 },
          { rank: 2, gameId: 'g2', trend: 'down', delta: -1 },
          { rank: 3, gameId: 'g3', trend: 'flat', delta: 0 },
          { rank: 4, gameId: 'g5', trend: 'up', delta: 2 },
          { rank: 5, gameId: 'g6', trend: 'new', delta: null },
          { rank: 6, gameId: 'g9', trend: 'down', delta: -2 },
          { rank: 7, gameId: 'g10', trend: 'down', delta: -3 },
          { rank: 8, gameId: 'g11', trend: 'up', delta: 5 },
          { rank: 9, gameId: 'g13', trend: 'new', delta: null },
          { rank: 10, gameId: 'g12', trend: 'new', delta: null },
          { rank: 11, gameId: 'g15', trend: 'up', delta: 2 },
          { rank: 12, gameId: 'g17', trend: 'down', delta: -1 },
          { rank: 13, gameId: 'g18', trend: 'flat', delta: 0 },
          { rank: 14, gameId: 'g19', trend: 'up', delta: 3 },
          { rank: 15, gameId: 'g21', trend: 'down', delta: -2 },
          { rank: 16, gameId: 'g22', trend: 'new', delta: null },
          { rank: 17, gameId: 'g23', trend: 'down', delta: -1 },
          { rank: 18, gameId: 'g20', trend: 'new', delta: null },
          { rank: 19, gameId: 'g24', trend: 'up', delta: 1 },
          { rank: 20, gameId: 'g16', trend: 'flat', delta: 0 }
        ]
      },
      citations: [
        {
          sourceId: 's1', sourceName: '游戏葡萄', articleId: 'a1', capturedAt: '2026-10-16 08:20',
          entries: [
            { rank: 2, gameId: 'g1' }, { rank: 1, gameId: 'g2' }, { rank: 3, gameId: 'g3' },
            { rank: 4, gameId: 'g5' }, { rank: 6, gameId: 'g6' }, { rank: 5, gameId: 'g9' },
            { rank: 7, gameId: 'g10' }, { rank: 8, gameId: 'g11' }, { rank: 9, gameId: 'g13' },
            { rank: 10, gameId: 'g12' },
            { rank: 11, gameId: 'g15' }, { rank: 12, gameId: 'g17' }, { rank: 13, gameId: 'g18' },
            { rank: 14, gameId: 'g19' }, { rank: 15, gameId: 'g21' }, { rank: 16, gameId: 'g22' },
            { rank: 17, gameId: 'g23' }, { rank: 18, gameId: 'g20' }, { rank: 19, gameId: 'g24' },
            { rank: 20, gameId: 'g16' }
          ]
        },
        {
          sourceId: 's2', sourceName: '罗斯基', articleId: 'a2', capturedAt: '2026-10-16 09:12',
          entries: [
            { rank: 1, gameId: 'g1' }, { rank: 2, gameId: 'g2' }, { rank: 3, gameId: 'g3' },
            { rank: 4, gameId: 'g5' }, { rank: 5, gameId: 'g6' }, { rank: 6, gameId: 'g9' },
            { rank: 7, gameId: 'g10' }, { rank: 8, gameId: 'g11' }, { rank: 9, gameId: 'g13' },
            { rank: 10, gameId: 'g12' }, { rank: 11, gameId: 'g15' }, { rank: 12, gameId: 'g17' },
            { rank: 13, gameId: 'g18' }, { rank: 14, gameId: 'g19' }, { rank: 15, gameId: 'g21' },
            { rank: 16, gameId: 'g22' }, { rank: 17, gameId: 'g23' }, { rank: 18, gameId: 'g20' },
            { rank: 19, gameId: 'g24' }, { rank: 20, gameId: 'g16' }
          ]
        }
      ],
      conflicts: [
        { id: 'cf1', gameId: 'g1', officialRank: 1, citationRank: 2, sourceName: '游戏葡萄', articleId: 'a1', status: 'open', note: '' },
        { id: 'cf2', gameId: 'g2', officialRank: 2, citationRank: 1, sourceName: '游戏葡萄', articleId: 'a1', status: 'open', note: '' },
        { id: 'cf3', gameId: 'g6', officialRank: 5, citationRank: 6, sourceName: '游戏葡萄', articleId: 'a1', status: 'open', note: '' },
        { id: 'cf4', gameId: 'g9', officialRank: 6, citationRank: 5, sourceName: '游戏葡萄', articleId: 'a1', status: 'open', note: '' }
      ]
    },
    'douyin_mini:hot:2026-10-16': {
      platform: 'douyin_mini', board: 'hot', date: '2026-10-16', status: 'provisional',
      official: null,
      citations: [
        {
          sourceId: 's5', sourceName: '手游那点事', articleId: 'a5', capturedAt: '2026-10-16 12:36',
          entries: [
            { rank: 1, gameId: 'g4' }, { rank: 2, gameId: 'g7' }, { rank: 3, gameId: 'g8' },
            { rank: 4, gameId: 'g1' }, { rank: 5, gameId: 'g3' }, { rank: 6, gameId: null, rawName: '猪猪侠快跑' },
            { rank: 7, gameId: 'g14' }, { rank: 8, gameId: 'g2' }, { rank: 9, gameId: 'g15' },
            { rank: 10, gameId: 'g19' }, { rank: 11, gameId: 'g24' }, { rank: 12, gameId: 'g23' }
          ]
        }
      ],
      conflicts: []
    }
  };

  const review = {
    mapping: [
      { id: 'rm1', rawName: '抓大鹅正版', platform: 'wechat_mini', board: 'hot', rank: 2, articleId: 'a2', suggestedGameId: 'g1', confidence: 0.94 },
      { id: 'rm2', rawName: '向僵尸开炮-末日', platform: 'douyin_mini', board: 'hot', rank: 5, articleId: 'a5', suggestedGameId: 'g3', confidence: 0.91 },
      { id: 'rm3', rawName: '猪猪侠快跑', platform: 'douyin_mini', board: 'hot', rank: 6, articleId: 'a5', suggestedGameId: null, confidence: 0.42 },
      { id: 'rm4', rawName: '咸鱼之王-官方版', platform: 'wechat_mini', board: 'hot', rank: 11, articleId: 'a1', suggestedGameId: 'g15', confidence: 0.92 },
      { id: 'rm5', rawName: '动物餐厅：治愈小店', platform: 'wechat_mini', board: 'hot', rank: 12, articleId: 'a1', suggestedGameId: 'g17', confidence: 0.89 },
      { id: 'rm6', rawName: '球球大作战正版', platform: 'wechat_mini', board: 'hot', rank: 18, articleId: 'a1', suggestedGameId: 'g20', confidence: 0.88 },
      { id: 'rm7', rawName: '蛋仔派对-欢乐季', platform: 'wechat_mini', board: 'hot', rank: 13, articleId: 'a1', suggestedGameId: 'g18', confidence: 0.86 },
      { id: 'rm8', rawName: '疯狂骑士团-放置版', platform: 'wechat_mini', board: 'hot', rank: 20, articleId: 'a2', suggestedGameId: 'g16', confidence: 0.9 }
    ],
    category: [
      { id: 'rc1', gameId: 'g7', l1: '策略', l2: '塔防', suggestedL3: '传统塔防', articleId: 'a5' },
      { id: 'rc2', gameId: 'g11', l1: '模拟经营', l2: '经营养成', suggestedL3: '小镇生活', articleId: 'a4' },
      { id: 'rc3', gameId: 'g21', l1: '策略', l2: '塔防', suggestedL3: '传统塔防', articleId: 'a1' },
      { id: 'rc4', gameId: 'g22', l1: '模拟经营', l2: '经营养成', suggestedL3: '小镇生活', articleId: 'a13' },
      { id: 'rc5', gameId: 'g24', l1: '模拟经营', l2: '经营养成', suggestedL3: '餐厅', articleId: 'a13' }
    ],
    claims: ['cl5', 'cl8', 'cl14', 'cl16'],
    errors: [
      { id: 're1', articleId: 'a3', reason: '正文抓取超时（30s）', time: '2026-10-16 10:24', attempts: 2 },
      { id: 're2', articleId: 'a17', reason: 'HTTP 403（访问被拒绝）', time: '2026-10-16 18:44', attempts: 1 },
      { id: 're3', articleId: 'a18', reason: 'OCR 置信度 0.64，低于阈值 0.70', time: '2026-10-16 19:02', attempts: 1 }
    ]
  };

  const digestSections = [
    { key: 'overview', title: '今日概览', icon: 'sparkles', hint: '3-5 条关键变化' },
    { key: 'wechat', title: '微信小游戏榜', icon: 'bar-chart-3', hint: '基于官方基准快照' },
    { key: 'douyin', title: '抖音小游戏榜', icon: 'bar-chart-3', hint: '仅有转述，标注未经官方核对' },
    { key: 'category', title: '品类动态', icon: 'layers', hint: '按 L1 / L2 汇总' },
    { key: 'claims', title: '值得关注的观点', icon: 'message-square', hint: '含分歧与原文引用' },
    { key: 'pending', title: '待核实事项', icon: 'alert-triangle', hint: '不影响主结论' }
  ];

  const digestItems = [
    { id: 'd1', section: 'overview', text: '微信小游戏：《抓大鹅》时隔两周重回榜首，较昨日上升 4 位。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd2', section: 'overview', text: '抖音小游戏：《无尽冬日》连续 12 天排名第一，头部格局未变。', source: '手游那点事', refType: 'snapshot', refId: 'douyin_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd3', section: 'overview', text: '品类侧：消除品类今日有 3 款产品进入微信前十，占比升至 30%。', source: '小游戏观察', refType: 'claim', refId: 'cl7', selected: true, edited: false },
    { id: 'd4', section: 'wechat', text: '《抓大鹅》升至第 1（+4），《寻道大千》退居第 2（-1）。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd5', section: 'wechat', text: '《羊了个羊》以新进身份回到第 5，消除赛道竞争加剧。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd6', section: 'wechat', text: '《心动小镇》上升 5 位至第 8，模拟经营新品开始起量。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd7', section: 'wechat', text: '《元梦之星》下降 3 位至第 7，派对品类热度回落。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: false, edited: false },
    { id: 'd8', section: 'douyin', text: '《无尽冬日》连续 12 天第一，畅销与热门双榜重合。', source: '手游那点事', refType: 'snapshot', refId: 'douyin_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd9', section: 'douyin', text: '《国王指意》稳居第 2，塔防品类在抖音保持强势。', source: '手游那点事', refType: 'snapshot', refId: 'douyin_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd10', section: 'douyin', text: '《冒险者日记》位居第 3，抖音榜当前仅有转述，名次待官方核对。', source: '手游那点事', refType: 'snapshot', refId: 'douyin_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd11', section: 'category', text: '消除（L2）在微信前十占 3 席，为今日第一大玩法。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd12', section: 'category', text: '模拟经营（L1）新进 2 款，主要来自农场与小镇题材。', source: '小游戏观察', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd13', section: 'claims', text: '抓大鹅这次回到榜首，靠的并不是买量，而是把两年前那套社交裂变重新跑通了。', source: '游戏葡萄', refType: 'claim', refId: 'cl1', selected: true, edited: false },
    { id: 'd14', section: 'claims', text: '无尽冬日连续 12 天霸榜，核心在于稳定的内容供给节奏。', source: '游戏那点事', refType: 'claim', refId: 'cl6', selected: true, edited: false },
    { id: 'd15', section: 'claims', text: '分歧：游戏葡萄与罗斯基对《寻道大千》的判断相反，前者认为素材疲劳，后者仍看好长线。', source: '游戏葡萄 / 罗斯基', refType: 'conflict', refId: 'cf2', selected: false, edited: false },
    { id: 'd16', section: 'pending', text: '抖音热门榜当前仅有转述，名次口径待官方核对。', source: '手游那点事', refType: 'snapshot', refId: 'douyin_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd17', section: 'pending', text: '《心动小镇》L3 品类待补，暂按 L2 计入统计。', source: '待核队列', refType: 'review', refId: 'rc2', selected: true, edited: false },
    { id: 'd18', section: 'overview', text: '《我是大东家》以新进身份进入微信热门榜第 16。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd19', section: 'wechat', text: '《咸鱼之王》升至第 11（+2），放置卡牌仍是微信大盘主力。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd20', section: 'wechat', text: '《蛋仔派对》稳居第 13，派对品类未出现新头部。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd21', section: 'douyin', text: '抖音榜第 6 位的《猪猪侠快跑》尚未映射，暂不计入品类统计。', source: '手游那点事', refType: 'review', refId: 'rm3', selected: true, edited: false },
    { id: 'd22', section: 'category', text: '模拟经营（L1）在微信前二十占 5 席，餐厅与小镇题材各 2 款。', source: '微信小游戏官方榜单', refType: 'snapshot', refId: 'wechat_mini:hot:2026-10-16', selected: true, edited: false },
    { id: 'd23', section: 'claims', text: '动物餐厅的长线运营并不依赖高频买量，而是靠季节性内容维持回流。', source: '游戏那点事', refType: 'claim', refId: 'cl9', selected: true, edited: false },
    { id: 'd24', section: 'claims', text: 'io 竞技在抖音仍有低成本获量机会，关键是首局三秒内给出反馈。', source: '竞核', refType: 'claim', refId: 'cl11', selected: false, edited: false },
    { id: 'd25', section: 'pending', text: '《疯狂骑士团-放置版》别名待确认，暂按主名统计。', source: '待核队列', refType: 'review', refId: 'rm8', selected: true, edited: false },
    { id: 'd26', section: 'pending', text: '《三国吧兄弟》《我是大东家》《乌冬的旅店》L3 品类待补，暂按 L2 统计。', source: '待核队列', refType: 'review', refId: 'rc3', selected: true, edited: false }
  ];

  const workbench = {
    date: '2026-10-16',
    newEntries: 7,
    coverage: 12,
    movements: [
      { gameId: 'g1', platform: 'wechat_mini', rank: 1, trend: 'up', delta: 4, note: '重回榜首' },
      { gameId: 'g6', platform: 'wechat_mini', rank: 5, trend: 'new', delta: null, note: '新进榜' },
      { gameId: 'g11', platform: 'wechat_mini', rank: 8, trend: 'up', delta: 5, note: '新游起量' },
      { gameId: 'g10', platform: 'wechat_mini', rank: 7, trend: 'down', delta: -3, note: '连续下滑' },
      { gameId: 'g15', platform: 'wechat_mini', rank: 11, trend: 'up', delta: 2, note: '放置卡牌回升' },
      { gameId: 'g17', platform: 'wechat_mini', rank: 12, trend: 'down', delta: -1, note: '餐厅题材回落' },
      { gameId: 'g22', platform: 'wechat_mini', rank: 16, trend: 'new', delta: null, note: '古风经营新进' },
      { gameId: 'g19', platform: 'wechat_mini', rank: 14, trend: 'up', delta: 3, note: 'io 竞技回暖' },
      { gameId: 'g21', platform: 'wechat_mini', rank: 15, trend: 'down', delta: -2, note: '塔防新品承压' },
      { gameId: 'g20', platform: 'wechat_mini', rank: 18, trend: 'new', delta: null, note: 'io 新品进榜' },
      { gameId: 'g8', platform: 'douyin_mini', rank: 3, trend: 'flat', delta: 0, note: '暂定快照' },
      { gameId: 'g4', platform: 'douyin_mini', rank: 1, trend: 'flat', delta: 0, note: '连续 12 天第一' }
    ]
  };

  const tags = [
    { dimension: '玩法', name: '放置' }, { dimension: '玩法', name: '合成' }, { dimension: '玩法', name: '塔防' },
    { dimension: '玩法', name: '消除' }, { dimension: '玩法', name: '开箱' }, { dimension: '玩法', name: '社交裂变' },
    { dimension: '玩法', name: '卡牌' }, { dimension: '玩法', name: '经营' }, { dimension: '玩法', name: '派对' },
    { dimension: '玩法', name: 'io' }, { dimension: '玩法', name: '竞技' },
    { dimension: '题材', name: '末日' }, { dimension: '题材', name: '三国' }, { dimension: '题材', name: '仙侠' },
    { dimension: '题材', name: '田园' }, { dimension: '题材', name: '校园' }, { dimension: '题材', name: '小镇' },
    { dimension: '题材', name: '古风' }, { dimension: '题材', name: '治愈' }, { dimension: '题材', name: 'IP' },
    { dimension: '美术', name: '3D卡通' }, { dimension: '美术', name: '2D手绘' }, { dimension: '美术', name: '像素' },
    { dimension: '美术', name: '写实' }, { dimension: '美术', name: '2D卡通' },
    { dimension: '变现', name: 'IAA' }, { dimension: '变现', name: 'IAP' }, { dimension: '变现', name: '混合变现' },
    { dimension: '生命周期', name: '新游' }, { dimension: '生命周期', name: '成长期' },
    { dimension: '生命周期', name: '成熟期' }, { dimension: '生命周期', name: '衰退期' },
    { dimension: '生命周期', name: '长线' }
  ];

  const members = [
    { id: 'u1', name: '林渝', role: 'operator', title: '平台运营', lastActive: '今天 09:42' },
    { id: 'u2', name: '周宁', role: 'lead', title: '团队负责人', lastActive: '今天 08:15' },
    { id: 'u3', name: '陈默', role: 'admin', title: '管理员', lastActive: '昨天 18:30' },
    { id: 'u4', name: '许知', role: 'operator', title: '平台运营', lastActive: '昨天 17:12' },
    { id: 'u5', name: '沈舟', role: 'operator', title: '数据运营', lastActive: '今天 10:05' },
    { id: 'u6', name: '顾言', role: 'lead', title: '内容负责人', lastActive: '昨天 16:40' }
  ];

  const modelConfig = {
    baseUrl: 'https://api.example.com/v1',
    model: 'qwen-plus',
    apiKey: 'sk-demo-••••••••••••',
    ocr: 'RapidOCR（本地）',
    usage: { calls: 126, tokens: '48.2k', cost: '¥3.20' }
  };

  const statusSteps = ['received', 'fetched', 'parsed', 'deduped', 'extracted', 'categorized', 'review_required', 'published'];
  const statusLabels = {
    received: '已接收', fetched: '已抓取', parsed: '已解析', deduped: '已去重',
    extracted: '已抽取', categorized: '已归类', review_required: '待人工确认', published: '已发布'
  };

  return {
    platforms, boards, sourceTypes, statusSteps, statusLabels,
    categoryTree, sources, games, articles, observations, claims, rankings,
    review, digestSections, digestItems, workbench, tags, members, modelConfig
  };
})();
