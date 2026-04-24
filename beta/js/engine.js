// js/engine.js
// 負責處理所有骰子數值的結算與配對邏輯

const relicBaseVals = { 1: 10, 2: 10, 3: 11, 4: 11, 5: 11, 6: 11, 7: 12, 8: 12 };

// --- Modular Shackle Hooks ---
const ShackleHooks = {
    blackhole: {
        preDice: (dice) => dice.map(d => ({ ...d, val: d.val === 8 ? 1 : d.val }))
    },
    numberplunder: {
        filterDice: (d, meta) => d.val !== meta.targetNumber
    },
    drowning: {
        modifyBase: (d, meta, ctx) => {
            if (d.val === 5) return { baseVal: 0, multi: 1 };
            return null;
        }
    },
    parityfear: {
        modifyBase: (d, meta, ctx) => {
            if (meta.fearType === 'odd' && d.val % 2 !== 0) return { baseVal: 0, multi: 0 };
            if (meta.fearType === 'even' && d.val % 2 === 0) return { baseVal: 0, multi: 0 };
            return null; // Fallback to default
        }
    },
    isolated: {
        postCalc: (res) => {
            if (res.tagA.name !== '無') res.tagA.multi /= 2.0;
            res.globalNotes.push('【孤立無援】發動: A區倍率減半。');
        }
    },
    ordercollapse: {
        postCalc: (res) => {
            res.tagB = { name: '無', multi: 1.0, used: [] };
            res.globalNotes.push('【秩序崩壞】發動: B區倍率強制失效。');
        }
    },
    chaoslaw: {
        postCalc: (res) => {
            let temp = { ...res.tagA };
            res.tagA = { ...res.tagB };
            res.tagB = temp;
            res.globalNotes.push('【混沌法則】發動: A、B區計分表對調。');
        }
    },
    banality: {
        postCalc: (res) => {
            if (res.tagD.name !== '無') res.tagD.multi = 1.0;
            res.globalNotes.push('【平庸之惡】發動: D區倍率強制為 1.0。');
        }
    },
    shortcircuit: {
        postCalc: (res) => {
            res.globalMulti = Math.max(1.0, res.globalMulti - 0.5);
            res.globalNotes.push('【短路】發動: 總倍率 -0.5x。');
        }
    },
    badluck: {
        postCalc: (res, meta, ctx) => {
            let count1 = ctx.workingDice.filter(d => d.val === 1).length;
            if (count1 > 0) {
                res.globalMulti = Math.max(1.0, res.globalMulti - (count1 * 0.1));
                res.globalNotes.push(`【霉運】發動: 扣除 ${count1 * 0.1}x 總倍率。`);
            }
        }
    },
    lonely: {
        postCalc: (res, meta, ctx) => {
            let usedIds = new Set();
            
            // Reconstruct used ids from matched values.
            // Because used arrays just contain numbers, we have to match them greedily back to dice.
            let availableDice = [...ctx.workingDice];
            
            const markUsed = (usedVals) => {
                if (!usedVals) return;
                usedVals.forEach(v => {
                    let idx = availableDice.findIndex(d => d.val === v);
                    if (idx !== -1) {
                        usedIds.add(availableDice[idx].id);
                        availableDice.splice(idx, 1);
                    }
                });
            };

            markUsed(res.tagA.used);
            markUsed(res.tagB.used);
            markUsed(res.tagC.used);
            markUsed(res.tagD.used);

            let penalty = 0;
            ctx.workingDice.forEach(d => {
                if (!usedIds.has(d.id)) {
                    penalty += ctx.baseContributions[d.id] || 0;
                }
            });

            if (penalty > 0) {
                res.totalBase = Math.max(0, res.totalBase - penalty);
                res.globalNotes.push(`【孤立】發動: 散牌不計入基礎點數。`);
            }
        }
    },
    sealeddoor: {
        postCalc: (res) => {
            if (res.tagA.name === '無') {
                res.globalMulti = 0;
                res.globalNotes.push('【封印之門】發動: 沒有對子，傷害歸零。');
            }
        }
    }
};

function applyShacklePostHooks(scoreResult, shackleConfig, workingDice, baseContributions) {
    if (!shackleConfig) return;
    
    // Some shackles just need notes pushed if they operated in pre-hooks
    if (shackleConfig.id === 'blackhole') scoreResult.globalNotes.push('【黑洞】發動: 所有的 8 變成 1。');
    if (shackleConfig.id === 'parityfear') scoreResult.globalNotes.push(`【奇/偶數恐懼】發動: ${shackleConfig.fearType === 'odd' ? '奇數' : '偶數'}點數歸零。`);
    if (shackleConfig.id === 'numberplunder') scoreResult.globalNotes.push(`【數字掠奪】發動: 數字 ${shackleConfig.targetNumber} 視為廢牌。`);
    if (shackleConfig.id === 'drowning') scoreResult.globalNotes.push(`【沉溺】發動: 5 點數歸零。`);
    
    let hookDef = ShackleHooks[shackleConfig.id];
    if (hookDef && hookDef.postCalc) {
        hookDef.postCalc(scoreResult, shackleConfig, { workingDice, baseContributions });
    }
}

export function calculateEngineScore(dice, playerRelics, rollsLeft, playerHp = 3, shackleConfig = null, isInitialRoll = false, turnsLeft = 0, env = {}) {
    let stageLevel = env.level || 0;
    let E = stageLevel + 1;
    let currentGold = env.gold || 0;
    let totalGoldEarned = env.totalGoldEarned || 0;
    let totalRelics = (env.relics || []).length;
    let unlockedHands = env.unlockedHands || 0;
    let kills = env.level || 0;

    let workingDice = [...dice];

    // --- Shackle Pre-Hooks ---
    if (shackleConfig && ShackleHooks[shackleConfig.id] && ShackleHooks[shackleConfig.id].preDice) {
        workingDice = ShackleHooks[shackleConfig.id].preDice(workingDice, shackleConfig);
    }
    
    if (shackleConfig && ShackleHooks[shackleConfig.id] && ShackleHooks[shackleConfig.id].filterDice) {
        workingDice = workingDice.filter(d => ShackleHooks[shackleConfig.id].filterDice(d, shackleConfig));
    }

    let counts = new Array(9).fill(0);
    workingDice.forEach(d => counts[d.val]++);

    let totalBase = 0;
    let baseContributions = {};
    let globalNotes = [];

    let isExploited = shackleConfig && shackleConfig.id === 'exploitation';

    workingDice.forEach(d => {
        let multi = 1;
        let v = d.val;
        let baseVal = v; 

        if (playerRelics.includes('doubleedge')) {
            if (v === 2) baseVal = 20;
            if (v === 3) baseVal = 0;
        }

        let hookResult = null;
        if (shackleConfig && ShackleHooks[shackleConfig.id] && ShackleHooks[shackleConfig.id].modifyBase) {
            hookResult = ShackleHooks[shackleConfig.id].modifyBase(d, shackleConfig, { relicBaseVals, playerRelics });
        }

        if (hookResult) {
            baseVal = hookResult.baseVal;
            multi = hookResult.multi;
        } else {
            if (playerRelics.includes(`b${v}`) && (!shackleConfig || shackleConfig.id !== 'oblivion')) {
                baseVal = relicBaseVals[v];
            }
            if ([1,2,3].includes(v) && playerRelics.includes('small')) multi *= (isExploited ? 2.5 : 5.0);
            if ([4,5].includes(v) && playerRelics.includes('mid')) multi *= (isExploited ? 1.5 : 3.0);
            if ([6,7,8].includes(v) && playerRelics.includes('big')) multi *= (isExploited ? 1.0 : 2.0);
            if (v % 2 !== 0 && playerRelics.includes('odd')) multi *= (isExploited ? 1.25 : 2.5);
            if (v % 2 === 0 && playerRelics.includes('even')) multi *= (isExploited ? 1.25 : 2.5);
        }

        let contribution = baseVal * multi;
        baseContributions[d.id] = contribution;
        totalBase += contribution;
    });


    let freqs = counts.slice(1).filter(c => c > 0);
    if (playerRelics.includes('fusion_arithmetic')) {
        let diffCount = counts.filter(c => c > 0).length;
        let bonus = diffCount * 8 * E;
        totalBase += bonus;
        globalNotes.push(`【等差死神】發動: 增加 ${bonus} 基礎點數`);
    } else if (playerRelics.includes('arithmetic')) {
        let uniqueCount = freqs.length;
        totalBase += uniqueCount * 8;
        globalNotes.push(`【等差數列】 +${uniqueCount * 8} 基礎點數`);
    }

    if (playerRelics.includes('luckyseven') && counts[7] > 0) {
        let extra = counts[7] * 77;
        totalBase += extra;
        globalNotes.push(`【幸運七】 +${extra} 基礎點數`);
    }

    // --- 陣列配對輔助函式 ---
    function getFreqVals(req1, req2 = 0) {
        let c = [...counts], used = [];
        let v1 = -1; for(let i=8; i>=1; i--) if(c[i]>=req1) { v1 = i; break; }
        if(v1 !== -1) { for(let k=0; k<req1; k++) used.push(v1); c[v1] -= req1; } else return false;
        if(req2) {
            let v2 = -1; for(let i=8; i>=1; i--) if(c[i]>=req2) { v2 = i; break; }
            if(v2 !== -1) { for(let k=0; k<req2; k++) used.push(v2); } else return false;
        }
        return used;
    }

    function getPairsVals(numPairs) {
        let c = [...counts], used = [], pairsFound = 0;
        for(let i=8; i>=1 && pairsFound < numPairs; i--) {
            while(c[i] >= 2 && pairsFound < numPairs) { used.push(i, i); c[i] -= 2; pairsFound++; }
        }
        return pairsFound === numPairs ? used : false;
    }

    function getStrictPairsVals(numPairs) {
        let used = [], pairsFound = 0;
        for(let i=8; i>=1; i--) { if(counts[i] === 2) { used.push(i, i); pairsFound++; } }
        return pairsFound === numPairs ? used : false;
    }

    function extractVals(targetLengths) {
        let currentLengths = [...targetLengths].sort((a,b)=>b-a);
        function search(c, idx, used) {
            if(idx === currentLengths.length) return used;
            let len = currentLengths[idx];
            for(let start=1; start<=8-len+1; start++){
                let valid = true;
                for(let i=0; i<len; i++) if(c[start+i]<1) valid=false;
                if(valid){
                    let nextC = [...c], nextUsed = [...used];
                    for(let i=0; i<len; i++) { nextC[start+i]--; nextUsed.push(start+i); }
                    let res = search(nextC, idx+1, nextUsed);
                    if(res) return res;
                }
            }
            return false;
        }
        return search(counts, 0, []);
    }

    function exactPartitionVals(c, numSeqs) {
        let remaining = c.reduce((a,b)=>a+b, 0);
        if (remaining === 0 && numSeqs === 0) return [];
        if (remaining < numSeqs * 2 || numSeqs === 0) return false;
        for(let len=2; len<=8; len++){
            for(let start=1; start<=8-len+1; start++){
                let valid = true;
                for(let i=0; i<len; i++) if(c[start+i]<1) valid=false;
                if(valid){
                    let nextC = [...c], usedHere = [];
                    for(let i=0; i<len; i++) { nextC[start+i]--; usedHere.push(start+i); }
                    let res = exactPartitionVals(nextC, numSeqs - 1);
                    if(res !== false) return usedHere.concat(res);
                }
            }
        }
        return false;
    }

    function checkAllChowsVals(c) {
        for(let i=1; i<=6; i++) {
            if(c[i]>=1 && c[i+1]>=1 && c[i+2]>=1) {
                let c1 = [...c]; c1[i]--; c1[i+1]--; c1[i+2]--;
                for(let j=1; j<=6; j++) {
                    if(c1[j]>=1 && c1[j+1]>=1 && c1[j+2]>=1) {
                        let c2 = [...c1]; c2[j]--; c2[j+1]--; c2[j+2]--;
                        let p = -1; for(let k=8; k>=1; k--) if(c2[k]>=2) p = k;
                        if(p !== -1) return [i,i+1,i+2, j,j+1,j+2, p,p];
                    }
                }
            }
        }
        return false;
    }

    function checkAllPongsVals(c) {
        for(let i=1; i<=8; i++) {
            if(c[i]>=3) {
                let c1 = [...c]; c1[i]-=3;
                for(let j=1; j<=8; j++) {
                    if(c1[j]>=3) {
                        let c2 = [...c1]; c2[j]-=3;
                        let p = -1; for(let k=8; k>=1; k--) if(c2[k]>=2) p = k;
                        if(p !== -1) return [i,i,i, j,j,j, p,p];
                    }
                }
            }
        }
        return false;
    }

    function checkChowPongVals(c) {
        for(let i=1; i<=6; i++) {
            if(c[i]>=1 && c[i+1]>=1 && c[i+2]>=1) {
                let c1 = [...c]; c1[i]--; c1[i+1]--; c1[i+2]--;
                for(let j=1; j<=8; j++) {
                    if(c1[j]>=3) return [i, i+1, i+2, j, j, j];
                }
            }
        }
        return false;
    }

    // --- 判斷 A 區 ---
    let tagA = { name: '無', multi: 1.0, used: [] };
    let maxFreq = Math.max(...counts);
    if (maxFreq >= 8) tagA = { name: '八重奏', multi: 50.0, used: getFreqVals(8) };
    else if (maxFreq >= 7) tagA = { name: '七同', multi: 25.0, used: getFreqVals(7) };
    else if (maxFreq >= 6) tagA = { name: '六同', multi: 12.0, used: getFreqVals(6) };
    else if (maxFreq >= 5) tagA = { name: '五同', multi: 6.0, used: getFreqVals(5) };
    else if (maxFreq >= 4) tagA = { name: '四同', multi: 4.5, used: getFreqVals(4) };
    else if (maxFreq >= 3) tagA = { name: '三同', multi: 2.5, used: getFreqVals(3) };
    else if (maxFreq >= 2) { tagA = { name: '對子', multi: 1.5, used: getFreqVals(2) }; if (playerRelics.includes('doubles')) tagA.multi *= (isExploited ? 1.5 : 2.0); }

    // --- 判斷 B 區 ---
    let tagB = { name: '無', multi: 1.0, used: [] };
    let tempUsed;

    if (counts.slice(1,9).every(c => c>=1)) {
        tagB = { name: '大滿貫', multi: 25.0, used: [1,2,3,4,5,6,7,8] };
    } else if ((tempUsed = extractVals([7]))) {
        tagB = { name: '七連順', multi: 10.0, used: tempUsed };
    } else if ((tempUsed = extractVals([6]))) {
        tagB = { name: '六連順', multi: 6.0, used: tempUsed };
    } else if ((tempUsed = extractVals([5]))) {
        tagB = { name: '五連順', multi: 3.5, used: tempUsed };
    } else if ((tempUsed = extractVals([4]))) {
        tagB = { name: '四連順', multi: 2.5, used: tempUsed };
    } else if ((tempUsed = extractVals([3]))) {
        tagB = { name: '三連順', multi: 2.0, used: tempUsed };
    }

    if (tagB.name !== '無' && playerRelics.includes('straightfan')) { tagB.multi += (isExploited ? 1.0 : 2.0); }
    // --- 判斷 C 區 ---
    let tagC = { name: '無', multi: 1.0, used: [] };
    let candidates = [];

    const priorityOrder = [
        '平胡', '碰碰胡', '三龍會', '雙四連順',
        '雙子星', '葫蘆', '豪華四對子', '經典四對子', '中葫蘆',
        '順碰交響曲', '雙三連順', '雙三同', '小葫蘆',
        '三對子', '雙對子'
    ];

    if ((tempUsed = checkAllChowsVals(counts))) {
        candidates.push({ name: '平胡', multi: 6.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('平胡') });
    }
    if ((tempUsed = checkAllPongsVals(counts))) {
        candidates.push({ name: '碰碰胡', multi: 5.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('碰碰胡') });
    }
    if ((tempUsed = exactPartitionVals([...counts], 3))) {
        candidates.push({ name: '三龍會', multi: 12.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('三龍會') });
    }
    if ((tempUsed = extractVals([4, 4]))) {
        candidates.push({ name: '雙四連順', multi: 10.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('雙四連順') });
    }
    if ((tempUsed = getFreqVals(4, 4))) {
        candidates.push({ name: '雙子星', multi: 20.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('雙子星') });
    }
    if ((tempUsed = getFreqVals(5, 3))) {
        candidates.push({ name: '葫蘆', multi: 15.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('葫蘆') });
    }
    if ((tempUsed = getPairsVals(4))) {
        candidates.push({ name: '豪華四對子', multi: 15.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('豪華四對子') });
    }
    if ((tempUsed = getStrictPairsVals(4))) {
        candidates.push({ name: '經典四對子', multi: 10.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('經典四對子') });
    }
    if ((tempUsed = getFreqVals(4, 3))) {
        candidates.push({ name: '中葫蘆', multi: 8.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('中葫蘆') });
    }
    if ((tempUsed = checkChowPongVals(counts))) {
        candidates.push({ name: '順碰交響曲', multi: 4.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('順碰交響曲') });
    }
    if ((tempUsed = extractVals([3, 3]))) {
        candidates.push({ name: '雙三連順', multi: 4.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('雙三連順') });
    }
    if ((tempUsed = getFreqVals(3, 3))) {
        candidates.push({ name: '雙三同', multi: 3.5, used: tempUsed, priorityIndex: priorityOrder.indexOf('雙三同') });
    }
    if ((tempUsed = getFreqVals(3, 2))) {
        candidates.push({ name: '小葫蘆', multi: 3.5, used: tempUsed, priorityIndex: priorityOrder.indexOf('小葫蘆') });
    }
    if ((tempUsed = getPairsVals(3))) {
        let candidate = { name: '三對子', multi: 3.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('三對子') };
        if (playerRelics.includes('doubles')) candidate.multi *= (isExploited ? 1.5 : 2.0);
        candidates.push(candidate);
    }
    if ((tempUsed = getPairsVals(2))) {
        let candidate = { name: '雙對子', multi: 2.0, used: tempUsed, priorityIndex: priorityOrder.indexOf('雙對子') };
        if (playerRelics.includes('doubles')) candidate.multi *= (isExploited ? 1.5 : 2.0);
        candidates.push(candidate);
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => {
            if (b.multi !== a.multi) {
                return b.multi - a.multi;
            }
            return a.priorityIndex - b.priorityIndex;
        });
        let topCandidate = candidates[0];
        tagC = { name: topCandidate.name, multi: topCandidate.multi, used: topCandidate.used };
    }

    // --- 判斷 D 區 ---
    let tagD = { name: '無', multi: 1.0, used: [] };
    freqs = counts.slice(1).filter(c => c > 0);

    let oddCount = counts[1] + counts[3] + counts[5] + counts[7];
    let evenCount = counts[2] + counts[4] + counts[6] + counts[8];
    let orderReq = playerRelics.includes('fusion_scales') ? 6 : (playerRelics.includes('order') ? 7 : 8);

    let orderUsed = [];
    if (oddCount >= orderReq) {
        workingDice.forEach(d => { if(d.val % 2 !== 0) orderUsed.push(d.val); });
    } else if (evenCount >= orderReq) {
        workingDice.forEach(d => { if(d.val % 2 === 0) orderUsed.push(d.val); });
    }

    if (counts[1] + counts[8] === 8 && workingDice.length === 8) tagD = { name: '兩極', multi: 30.0, used: workingDice.map(d=>d.val) };
    else if (oddCount >= orderReq || evenCount >= orderReq) tagD = { name: '絕對秩序', multi: 8.0, used: orderUsed };
    else if (freqs.length === 8 && workingDice.length === 8) tagD = { name: '全異', multi: 2.5, used: workingDice.map(d=>d.val) };
    else if (counts[1] === 0 && counts[8] === 0) tagD = { name: '中庸之道', multi: 2.0, used: workingDice.map(d=>d.val) };


    if (playerRelics.includes('hodgepodge') && tagA.name !== '無' && tagB.name !== '無' && tagC.name !== '無') {
        totalBase += 100;
        globalNotes.push('【大雜燴】發動: A、B、C 區同時觸發，+100 基礎點數。');
    }

    if (playerRelics.includes('fusion_samsara')) {
        let usedIds = new Set();
        let markUsed = (usedArr) => {
            let availableDice = [...workingDice];
            usedArr.forEach(val => {
                let idx = availableDice.findIndex(d => d.val === val && !usedIds.has(d.id));
                if (idx !== -1) { usedIds.add(availableDice[idx].id); availableDice.splice(idx, 1); }
            });
        };
        markUsed(tagA.used); markUsed(tagB.used); markUsed(tagC.used); markUsed(tagD.used);
        
        let scatterCount = workingDice.length - usedIds.size;
        if (scatterCount > 0) {
            let bonus = counts[6] > 0 ? (counts[6] * E * 5) : 0; // 額外增加
            let scatterBase = 20 + bonus;
            workingDice.forEach(d => {
                if (!usedIds.has(d.id)) {
                    let originalContribution = baseContributions[d.id] || 0;
                    totalBase -= originalContribution;
                    totalBase += scatterBase;
                }
            });
            globalNotes.push(`【六道輪迴】發動: ${scatterCount} 顆散牌變為 ${scatterBase} 點計算。`);
        }
    } else if (playerRelics.includes('sixsmooth') && counts[6] > 0) {
        let usedIds = new Set();
        let markUsed = (usedArr) => {
            let availableDice = [...workingDice];
            usedArr.forEach(val => {
                let idx = availableDice.findIndex(d => d.val === val && !usedIds.has(d.id));
                if (idx !== -1) {
                    usedIds.add(availableDice[idx].id);
                    availableDice.splice(idx, 1);
                }
            });
        };
        markUsed(tagA.used);
        markUsed(tagB.used);
        markUsed(tagC.used);
        markUsed(tagD.used);

        let scatterAdded = 0;
        workingDice.forEach(d => {
            if (!usedIds.has(d.id)) {
                let originalContribution = baseContributions[d.id] || 0;
                totalBase -= originalContribution;
                totalBase += 15;
                scatterAdded++;
            }
        });
        if (scatterAdded > 0) {
            globalNotes.push(`【六六大順】發動: ${scatterAdded} 顆散牌變為 15 點計算。`);
        }
    }

    // --- 總乘區計算 ---
    let globalMulti = 1.0;
    
    // Evaluate Unused/Scatter
    let usedIdsTemp = new Set();
    let markUsedTemp = (usedArr) => {
        let availableDice = [...workingDice];
        usedArr.forEach(val => {
            let idx = availableDice.findIndex(d => d.val === val && !usedIdsTemp.has(d.id));
            if (idx !== -1) { usedIdsTemp.add(availableDice[idx].id); availableDice.splice(idx, 1); }
        });
    };
    markUsedTemp(tagA.used); markUsedTemp(tagB.used); markUsedTemp(tagC.used); markUsedTemp(tagD.used);
    let scatterCount = workingDice.length - usedIdsTemp.size;
    let isNoTag = (tagA.name === '無' && tagB.name === '無' && tagC.name === '無' && tagD.name === '無');
    
    if (playerRelics.includes('fusion_nebula') && (counts[1] > 0 || counts[2] > 0 || counts[3] > 0)) {
        let amt = 1.0 + scatterCount * 1.0;
        globalMulti *= amt;
        globalNotes.push(`【微縮星雲】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_pillar') && (counts[4] > 0 || counts[5] > 0)) {
        let basePillar = 3.0;
        let amt = basePillar + (kills * 0.2);
        globalMulti *= amt;
        globalNotes.push(`【中流砥柱】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_fortune') && (counts[4] > 0 || counts[5] > 0)) {
        let fiveCount = kills * 2 + counts[5]; 
        let amt = 1.0 + (fiveCount * 0.05);
        globalMulti *= amt;
        globalNotes.push(`【五福中天】 x${amt.toFixed(2)}`);
    }

    if (playerRelics.includes('fusion_chaos')) {
        let oddCount = counts[1] + counts[3] + counts[5] + counts[7];
        let evenCount = counts[2] + counts[4] + counts[6] + counts[8];
        if (oddCount === 4 && evenCount === 4) {
            let amt = 1.0 + (totalRelics * 0.5);
            globalMulti *= amt;
            globalNotes.push(`【混沌原力】 x${amt.toFixed(1)}`);
        }
    }
    
    if (playerRelics.includes('fusion_scales') && tagD.name === '絕對秩序') {
        let lostHp = 3 - playerHp;
        let amt = 1.0 + (lostHp * 1.5);
        if (playerHp === 1) amt *= 3.0;
        globalMulti *= amt;
        globalNotes.push(`【天秤之極】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_ares') && counts[1] > 0 && counts[8] > 0) {
        let amt = Math.pow(1.5, E);
        globalMulti *= amt;
        globalNotes.push(`【孤傲戰神】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_eternity') && turnsLeft === 1 && isNoTag) {
        let amt = rollsLeft * rollsLeft;
        if (amt < 1) amt = 1;
        globalMulti *= amt;
        globalNotes.push(`【一念永恆】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_glimmer') && tagA.name === '對子') {
        let turnsElapsed = 3 - turnsLeft + 1;
        let amt = 1.0 + (turnsElapsed * 1.5);
        globalMulti *= amt;
        globalNotes.push(`【微光聖戰】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_miracle') && isNoTag) {
        let amt = 1.0 + (unlockedHands * 0.5);
        globalMulti *= amt;
        globalNotes.push(`【凡骨奇蹟】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_titan') && [2, 5, 8, 9].includes(stageLevel)) {
        let amt = 1.0 + (E * 0.5);
        globalMulti *= amt;
        globalNotes.push(`【泰坦之握】 x${amt.toFixed(1)}`);
    }
    
    if (playerRelics.includes('fusion_infinite') && tagB.name !== '無') {
        let amt = 1.0 + (kills * 0.5);
        globalMulti *= amt;
        globalNotes.push(`【無限數列】 x${amt.toFixed(1)}`);
    }


    let baseABCD = 1.0;

    if (shackleConfig && shackleConfig.id === 'oblivion') globalNotes.push('【忘卻】發動: 無視遺物基礎點數。');
    if (isExploited) globalNotes.push('【剝削】發動: 遺物倍率減半。');

    if (playerRelics.includes('order')) {
        baseABCD = (tagA.multi + tagB.multi) * tagC.multi * tagD.multi;
        globalNotes.push('【寬容】發動: 絕對秩序只要七顆即可發動。');
    } else {
        baseABCD = tagA.multi * tagB.multi * tagC.multi * tagD.multi;
    }

    // ★ 更新：【雷爪獅的祝福】條件改為場上有 1
    if (playerRelics.includes('pansy') && counts[1] > 0) {
        let amt = isExploited ? 1.5 : 3.0;
        globalMulti *= amt;
        globalNotes.push(`【雷爪獅的祝福】 x${amt.toFixed(1)}`);
    }

    // ★ 新增：【捧夠的祝福】條件為場上有 8
    if (playerRelics.includes('pongo') && counts[8] > 0) {
        let amt = isExploited ? 1.5 : 3.0;
        globalMulti *= amt;
        globalNotes.push(`【捧夠的祝福】 x${amt.toFixed(1)}`);
    }

    if (playerRelics.includes('highlow') && counts[1] > 0 && counts[8] > 0) {
        let amt = isExploited ? 1.25 : 1.5;
        globalMulti *= amt;
        globalNotes.push(`【高低差】 x${amt.toFixed(2)}`);
    }

    if (playerRelics.includes('laststand') && rollsLeft === 0) {
        let amt = isExploited ? 1.25 : 1.5;
        globalMulti *= amt;
        globalNotes.push(`【破釜沉舟】 x${amt.toFixed(2)}`);
    }

    if (playerRelics.includes('allin') && playerHp === 1) {
        let amt = isExploited ? 1.25 : 2.5;
        globalMulti *= amt;
        globalNotes.push(`【孤注一擲】 x${amt.toFixed(2)}`);
    }


    if (playerRelics.includes('flicker') && tagA.name === '對子' && tagB.name === '無' && tagC.name === '無' && tagD.name === '無') {
        globalMulti += (isExploited ? 1.5 : 3.0);
        globalNotes.push(`【凡人微光】 +${(isExploited ? 1.5 : 3.0).toFixed(1)}x`);
    }

    if (playerRelics.includes('fivebless') && counts[5] > 0) {
        let amt = counts[5] * 0.2;
        globalMulti += (isExploited ? amt/2 : amt);
        globalNotes.push(`【五福臨門】 +${(isExploited ? amt/2 : amt).toFixed(1)}x`);
    }

    if (playerRelics.includes('fourdeath') && counts[4] === 4) {
        let amt = isExploited ? 2.0 : 4.0;
        globalMulti *= amt;
        globalNotes.push(`【四死如歸】 x${amt.toFixed(1)}`);
    }

    if (playerRelics.includes('oneshot') && isInitialRoll) {
        let amt = isExploited ? 1.5 : 3.0;
        globalMulti *= amt;
        globalNotes.push(`【一發入魂】 x${amt.toFixed(1)}`);
    }

    if (playerRelics.includes('extremist') && tagD.name !== '無') {
        let amt = isExploited ? 1.25 : 1.5;
        tagD.multi *= amt;
        globalNotes.push(`【極端份子】 D區 x${amt.toFixed(2)}`);
    }

    if (playerRelics.includes('rebel') && shackleConfig) {
        let amt = isExploited ? 1.25 : 1.5;
        globalMulti *= amt;
        globalNotes.push(`【反抗軍】 x${amt.toFixed(2)}`);
    }

    if (playerRelics.includes('royalflush') && tagA.name !== '無' && tagB.name !== '無') {
        let amt = isExploited ? 1.5 : 2.0;
        globalMulti *= amt;
        globalNotes.push(`【同花順】 x${amt.toFixed(1)}`);
    }

    if (playerRelics.includes('brink') && turnsLeft === 1) {
        let amt = isExploited ? 1.25 : 2.5;
        globalMulti *= amt;
        globalNotes.push(`【極限拉扯】 x${amt.toFixed(2)}`);
    }

    let rerollMulti = 1.0 + (rollsLeft * 0.5);
    if (rollsLeft > 0) {
        globalMulti *= rerollMulti;
        globalNotes.push(`剩餘資源加成 (剩 ${rollsLeft} 次) x${rerollMulti.toFixed(1)}`);
    }

    let result = {
        totalBase, tagA, tagB, tagC, tagD, globalMulti, globalNotes, finalMultiplier: 1.0, finalScore: 0
    };

    applyShacklePostHooks(result, shackleConfig, workingDice, baseContributions);

    result.finalMultiplier = (playerRelics.includes('order') ? (result.tagA.multi + result.tagB.multi) * result.tagC.multi * result.tagD.multi : result.tagA.multi * result.tagB.multi * result.tagC.multi * result.tagD.multi) * result.globalMulti;
    
    if (playerRelics.includes('mediocre') && result.finalMultiplier < 5.0) {
        result.finalMultiplier = 5.0;
        result.globalNotes.push('【平庸之善】發動: 總倍率提升至 x5.0。');
    }


    
    result.finalScore = result.totalBase * result.finalMultiplier;

    return result;
}
