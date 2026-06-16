import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../render.js';

const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
const safeArea = systemInfo.safeArea || {
  top: 0,
  bottom: SCREEN_HEIGHT,
  left: 0,
  right: SCREEN_WIDTH,
};
const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  pixelRatio: systemInfo.pixelRatio || 1,
  statusBarHeight: systemInfo.statusBarHeight || safeArea.top || 0,
  safeTop: safeArea.top || 0,
  safeBottom: SCREEN_HEIGHT - (safeArea.bottom || SCREEN_HEIGHT),
  safeLeft: safeArea.left || 0,
  safeRight: SCREEN_WIDTH - (safeArea.right || SCREEN_WIDTH),
  menuButton,
  contentTop: menuButton ? Math.max(safeArea.top || 0, menuButton.bottom) : safeArea.top || 0,
};

export const COLORS = {
  bg: '#111827',
  bgDeep: '#070B14',
  panel: '#1F2937',
  panelDark: '#111827',
  panelLight: '#2B3547',
  text: '#F9FAFB',
  textMuted: '#A7B0C0',
  textDim: '#64748B',
  border: '#F9FAFB',
  shadow: '#000000',
  orange: '#F97316',
  cyan: '#22D3EE',
  rose: '#F43F5E',
  blue: '#3B82F6',
  purple: '#A855F7',
  green: '#22C55E',
  yellow: '#FACC15',
  red: '#EF4444',
};

export const GAME_MODES = [
  {
    id: 'SCREAM_BIRD',
    title: '尖叫小鸟',
    shortTitle: '小鸟',
    subtitle: '大声向上飞',
    description: '大声飞 / 安静落',
    accent: COLORS.orange,
  },
  {
    id: 'SPRINT',
    title: '十秒狂飙',
    shortTitle: '狂飙',
    subtitle: '吼得越稳跑越远',
    description: '10秒冲刺',
    accent: COLORS.cyan,
  },
  {
    id: 'ROCKET',
    title: '声波火箭',
    shortTitle: '火箭',
    subtitle: '峰值决定高度',
    description: '3秒蓄力',
    accent: COLORS.rose,
  },
  {
    id: 'PUNCH',
    title: '分贝发泄馆',
    shortTitle: '发泄馆',
    subtitle: '喊出最高伤害',
    description: '5秒爆发',
    accent: COLORS.blue,
  },
  {
    id: 'MAGE',
    title: '言出法随小法师',
    shortTitle: '法师',
    subtitle: '音量越大法术越狠',
    description: '声控塔防',
    accent: COLORS.purple,
  },
];

export const TOUCH = {
  minSize: 44,
  pressDuration: 140,
};
