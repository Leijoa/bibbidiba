import { zh_tw_data } from './locales/zh-tw.js';
import { zh_cn_data } from './locales/zh-cn.js';
import { en_data } from './locales/en.js';
import { ja_data } from './locales/ja.js';

export const translations = {
  'zh-tw': {
    ...zh_tw_data,
    'ui': {
      'title_main': 'BIBBIDIBA',
      'title_sub': '比比丟八',
      'title_desc': '擲八顆骰子湊牌型疊加倍率！每回合重骰兩次，在限制回合內打倒敵人獲取遺物強化流派，挑戰連過十關！',
            'btn_roll': '重骰',
      'btn_roll_hint': '(可點擊骰子保留)',
      'btn_attack': '攻擊',
            'infinite_enemy_prefix': '虛空幻影',
            'score_total_base': '骰子點數加成後總和',
            'bonus_reroll': '剩餘資源加成 (剩 {0} 次)',
      'btn_continue': '繼續旅程',
      'btn_new_game': '開始新遊戲',
      'btn_collection': '📖 收集冊',
      'btn_history': '歷史牌局',
      'btn_souls': '👻 靈魂奉獻',
      'reset_souls': '重置靈魂 (退還所有花費)',
      'version': '[2.0版]',
      'author_info': '作者:雷爪獅 | Youtube:雷爪獅遊戲頻道 | threads:@leijoalan',
      'stage': '關卡',
      'hp': 'HP',
      'sound_on': '🔈 音效: 開',
      'sound_off': '🔈 音效: 關',
      'turns_left': '剩餘 {0} 回合',
      'rolls_left': '剩餘重骰：{0}',
      'board': '盤面',
      'damage_preview': '預估造成傷害',
      'owned_relics': '🎒 已持有遺物',
      'shop_title': '💰 芝芝商店',
      'shop_desc': '選擇獲取一件遺物來強化流派，或進入下一關。',
            'shop_select': '選擇',
      'shop_fusion_hint': '可融合',
      'btn_reroll': '刷新商店',
      'btn_next_stage': '離開並前往下一關 ➡️',
      'game_over': 'GAME OVER',
      'game_over_desc': '你未能擊敗敵人，旅程到此為止。',
      'btn_restart': '回到標題畫面',
      'btn_infinite': '進入無限塔',
      'tab_hands': '牌型',
      'tab_relics': '遺物',
      'tab_shackles': '枷鎖',
      'fusion_limit_msg': '你必須選擇捨棄並<span class="text-red-400">分解</span>其中一件遺物（退回基礎素材），才能容納新的力量！',
      'pb_title': '🏆 個人最佳紀錄',
      'pb_highest_dmg': '最高傷害',
      'pb_highest_multi': '最高倍率',
      'pb_highest_infinite': '最高無限層數',      'btn_rules': '📖 牌型表',      'empty_inventory': '背包空空如也',
      'fusion_condition': '\n\n合成條件: {0} + {1}',
      'fusion_text_short': '合成: {0} + {1}',
      'fusion_limit_msg': '你必須選擇捨棄並<span class="text-red-400">分解</span>其中一件遺物（退回基礎素材），才能容納新的力量！',      'empty_inventory': '背包空空如也',
      'fusion_condition': '\n\n合成条件: {0} + {1}',
      'fusion_text_short': '合成: {0} + {1}',
      'fusion_limit_msg': '你必须选择舍弃并<span class="text-red-400">分解</span>其中一件遗物（退回基础素材），才能容纳新的力量！',



      'rules_title': '📖 全牌型倍率表',
      'tab_hands': '牌型',
      'tab_relics': '遺物',
      'tab_shackles': '枷鎖'
    }
  },
  'zh-cn': {
    ...zh_cn_data,
    'ui': {
      'title_main': 'BIBBIDIBA',
      'title_sub': '比比丢八',
      'title_desc': '掷八颗骰子凑牌型叠加倍率！每回合重骰两次，在限制回合内打倒敌人获取遗物强化流派，挑战连过十关！',
            'btn_roll': '重骰',
      'btn_roll_hint': '(可点击骰子保留)',
      'btn_attack': '攻击',
            'infinite_enemy_prefix': '虚空幻影',
            'score_total_base': '骰子点数加成后总和',
            'bonus_reroll': '剩余资源加成 (剩 {0} 次)',
      'btn_continue': '继续旅程',
      'btn_new_game': '开始新游戏',
      'btn_collection': '📖 收集册',
      'btn_history': '历史牌局',
      'btn_souls': '👻 灵魂奉献',
      'reset_souls': '重置灵魂 (退还所有花费)',
      'version': '[2.0版]',
      'author_info': '作者:雷爪狮 | Youtube:雷爪狮游戏频道 | threads:@leijoalan',
      'stage': '关卡',
      'hp': 'HP',
      'sound_on': '🔈 音效: 开',
      'sound_off': '🔈 音效: 关',
      'turns_left': '剩余 {0} 回合',
      'rolls_left': '剩余重骰：{0}',
      'board': '盘面',
      'damage_preview': '预估造成伤害',
      'owned_relics': '🎒 已持有遗物',
      'shop_title': '💰 芝芝商店',
      'shop_desc': '选择获取一件遗物来强化流派，或进入下一关。',
            'shop_select': '选择',
      'shop_fusion_hint': '可融合',
      'btn_reroll': '刷新商店',
      'btn_next_stage': '离开并前往下一关 ➡️',
      'game_over': 'GAME OVER',
      'game_over_desc': '你未能击败敌人，旅程到此为止。',
      'btn_restart': '回到标题画面',
      'btn_infinite': '进入无限塔',
      'tab_hands': '牌型',
      'tab_relics': '遗物',
      'tab_shackles': '枷锁',
      'fusion_limit_msg': '你必须选择舍弃并<span class="text-red-400">分解</span>其中一件遗物（退回基础素材），才能容纳新的力量！',
      'pb_title': '🏆 个人最佳纪录',
      'pb_highest_dmg': '最高伤害',
      'pb_highest_multi': '最高倍率',
      'pb_highest_infinite': '最高无限层数',      'btn_rules': '📖 牌型表',      'empty_inventory': '背包空空如也',
      'fusion_condition': '\n\n合成条件: {0} + {1}',
      'fusion_text_short': '合成: {0} + {1}',
      'fusion_limit_msg': '你必须选择舍弃并<span class="text-red-400">分解</span>其中一件遗物（退回基础素材），才能容纳新的力量！',
      'locked': '未解锁',
      'locked_relic': '未解锁遗物',
      'locked_shackle': '未解锁枷锁',

      'rules_title': '📖 全牌型倍率表',
      'tab_hands': '牌型',
      'tab_relics': '遗物',
      'tab_shackles': '枷锁'
    }
  },
  'en': {
    ...en_data,
    'ui': {
      'title_main': 'BIBBIDIBA',
      'title_sub': 'Bibbidiba',
      'title_desc': 'Roll 8 dice to form hands and stack multipliers! Reroll twice per turn, defeat enemies within the turn limit to gain relics and strengthen your build. Challenge 10 stages in a row!',
            'btn_roll': 'Reroll',
      'btn_roll_hint': '(Click dice to lock)',
      'btn_attack': 'Attack',
            'infinite_enemy_prefix': 'Void Phantom',
            'score_total_base': 'Total Base Score',
            'bonus_reroll': 'Reroll Bonus ({0} left)',
      'btn_continue': 'Continue Journey',
      'btn_new_game': 'Start New Game',
      'btn_collection': '📖 Collection',
      'btn_history': 'Match History',
      'btn_souls': '👻 Soul Offering',
      'reset_souls': 'Reset Souls (Refund all costs)',
      'version': '[Version 2.0]',
      'author_info': 'Author: Leijoalan | Youtube: Leijoalan Game Channel | threads:@leijoalan',
      'stage': 'Stage',
      'hp': 'HP',
      'sound_on': '🔈 Sound: ON',
      'sound_off': '🔈 Sound: OFF',
      'turns_left': '{0} Turns Left',
      'rolls_left': 'Rerolls: {0}',
      'board': 'Board',
      'damage_preview': 'Estimated Damage',
      'owned_relics': '🎒 Owned Relics',
      'shop_title': '💰 Zhizhi Shop',
      'shop_desc': 'Choose a relic to strengthen your build, or proceed to the next stage.',
            'shop_select': 'Select',
      'shop_fusion_hint': 'Fusion',
      'btn_reroll': 'Reroll Shop',
      'btn_next_stage': 'Leave & Next Stage ➡️',
      'game_over': 'GAME OVER',
      'game_over_desc': 'You failed to defeat the enemy. Your journey ends here.',
      'btn_restart': 'Back to Title',
      'btn_infinite': 'Enter Infinite Tower',
      'tab_hands': 'Hands',
      'tab_relics': 'Relics',
      'tab_shackles': 'Shackles',
      'fusion_limit_msg': 'You must discard and <span class="text-red-400">dismantle</span> one of your relics (return to base materials) to make room for new power!',
      'pb_title': '🏆 Personal Bests',
      'pb_highest_dmg': 'Highest Damage',
      'pb_highest_multi': 'Highest Multiplier',
      'pb_highest_infinite': 'Max Infinite Lvl',      'btn_rules': '📖 Hands',      'empty_inventory': 'Inventory is empty',
      'fusion_condition': '\n\nFusion Req: {0} + {1}',
      'fusion_text_short': 'Fusion: {0} + {1}',
      'fusion_limit_msg': 'You must choose to discard and <span class="text-red-400">dismantle</span> one of your relics (returning base materials) to make room for new power!',
      'locked': 'Locked',
      'locked_relic': 'Locked Relic',
      'locked_shackle': 'Locked Shackle',


      'rules_title': '📖 Hands Multipliers',
      'tab_hands': 'Hands',
      'tab_relics': 'Relics',
      'tab_shackles': 'Shackles'
    }
  },
  'ja': {
    ...ja_data,
    'ui': {
      'title_main': 'BIBBIDIBA',
      'title_sub': 'ビビディバ',
      'title_desc': '8つのダイスを振って役を作り、倍率を重ねよう！毎ターン2回振り直し可能。制限ターン内に敵を倒して遺物を獲得し、ビルドを強化。10ステージ連続クリアを目指せ！',
            'btn_roll': '振り直し',
      'btn_roll_hint': '(クリックで固定)',
      'btn_attack': '攻撃',
            'infinite_enemy_prefix': '虚空の幻影',
            'score_total_base': 'ダイス基本点合計',
            'bonus_reroll': '残りリソースボーナス (残り {0} 回)',
      'btn_continue': '旅を続ける',
      'btn_new_game': '最初から',
      'btn_collection': '📖 コレクション',
      'btn_history': '対戦履歴',
      'btn_souls': '👻 魂の捧げ物',
      'reset_souls': 'ソウルリセット (全コスト返還)',
      'version': '[バージョン 2.0]',
      'author_info': '作者: Leijoalan | Youtube: 雷爪獅遊戲頻道 | threads:@leijoalan',
      'stage': 'ステージ',
      'hp': 'HP',
      'sound_on': '🔈 サウンド: オン',
      'sound_off': '🔈 サウンド: オフ',
      'turns_left': '残り {0} ターン',
      'rolls_left': '残り振り直し: {0}',
      'board': 'ボード',
      'damage_preview': '予想ダメージ',
      'owned_relics': '🎒 所持遺物',
      'shop_title': '💰 チチショップ',
      'shop_desc': '遺物を1つ選んでビルドを強化するか、次のステージに進みます。',
            'shop_select': '選択',
      'shop_fusion_hint': '合成可能',
      'btn_reroll': 'ショップ更新',
      'btn_next_stage': '立ち去り次へ ➡️',
      'game_over': 'GAME OVER',
      'game_over_desc': '敵を倒せませんでした。旅はここで終わります。',
      'btn_restart': 'タイトルへ戻る',
      'btn_infinite': '無限の塔へ',
      'tab_hands': '役',
      'tab_relics': '遺物',
      'tab_shackles': '枷鎖',
      'fusion_limit_msg': '新たな力を得るためには、遺物を1つ捨てて<span class="text-red-400">分解</span>（基礎素材に戻す）する必要があります！',
      'pb_title': '🏆 自己ベスト',
      'pb_highest_dmg': '最高ダメージ',
      'pb_highest_multi': '最高倍率',
      'pb_highest_infinite': '最高無限階層',      'btn_rules': '📖 役一覧',      'empty_inventory': 'バッグは空っぽです',
      'fusion_condition': '\n\n合成条件: {0} + {1}',
      'fusion_text_short': '合成: {0} + {1}',
      'fusion_limit_msg': '新しい力を得るには、遺物を1つ捨てて<span class="text-red-400">分解</span>（基礎素材に戻す）する必要があります！',
      'locked': '未解放',
      'locked_relic': '未解放の遺物',
      'locked_shackle': '未解放の枷鎖',


      'rules_title': '📖 役の倍率表',
      'tab_hands': '役',
      'tab_relics': '遺物',
      'tab_shackles': '枷鎖'
    }
  }
};

class I18nManager {
  constructor() {
    this.currentLocale = localStorage.getItem('bibbidiba_lang') || this.detectLanguage();
    if (!translations[this.currentLocale]) {
      this.currentLocale = 'zh-tw';
    }
    this.listeners = [];
  }

  detectLanguage() {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh-cn') || lang.startsWith('zh-sg') || lang.startsWith('zh-hans')) return 'zh-cn';
    if (lang.startsWith('zh')) return 'zh-tw';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('en')) return 'en';
    return 'zh-tw';
  }

  setLocale(locale) {
    if (translations[locale]) {
      this.currentLocale = locale;
      localStorage.setItem('bibbidiba_lang', locale);
      this.notifyListeners();
      this.updateDOM();
    }
  }

  getLocale() {
    return this.currentLocale;
  }

  t(key, ...args) {
    const keys = key.split('.');
    let value = translations[this.currentLocale];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    if (value === undefined) return key;

    if (args.length > 0) {
      return value.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined' ? args[number] : match;
      });
    }
    return value;
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  updateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });
  }
}

export const i18n = new I18nManager();
if (typeof window !== 'undefined') window.i18n = i18n;
window.i18n = i18n; // For easy console access and inline event handlers
