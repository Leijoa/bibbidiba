// js/engine.js
// 負責處理所有骰子數值的結算與配對邏輯

export function calculateEngineScore(dice, playerRelics, rollsLeft, playerHp = 3) {
    let counts = new Array(9).fill(0);
    dice.forEach(d => counts[d.val]++);

    let totalBase = 0;
    const relicBaseVals = { 1: 10, 2: 10, 3: 11, 4: 11, 5: 11, 6: 11, 7: 12, 8: 12 };

    dice.forEach(d => {
        let multi = 1;
        let v = d.val;
        let baseVal = v; // 預設底盤點數為骰面數字

        // 基礎點數計算
        if (playerRelics.includes(`b${v}`)) {
            baseVal = relicBaseVals[v];
        }

        // 小小、中中、大大的平衡倍率
        if ([1,2,3].includes(v) && playerRelics.includes('small')) multi *= 5.0;
        if ([4,5].includes(v) && playerRelics.includes('mid')) multi *= 4.5;
        if ([6,7,8].includes(v) && playerRelics.includes('big')) multi *= 4.0;

        if (v % 2 !== 0 && playerRelics.includes('odd')) multi *= 2.5;
        if (v % 2 === 0 && playerRelics.includes('even')) multi *= 2.5;

        totalBase += (baseVal * multi);
    });

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
    else if (maxFreq >= 2) tagA = { name: '對子', multi: 1.5, used: getFreqVals(2) };

    // --- 判斷 B 區 ---
    let tagB = { name: '無', multi: 1.0, used: [] };
    let bFull = counts.slice(1,9).every(c => c>=1) ? [1,2,3,4,5,6,7,8] : false;
    let bDragon = exactPartitionVals([...counts], 3);
    let b7 = extractVals([7]);
    let b6 = extractVals([6]);
    let bDouble4 = extractVals([4, 4]);
    let b5 = extractVals([5]);
    let bDouble3 = extractVals([3, 3]);
    let b4 = extractVals([4]);
    let b3 = extractVals([3]);

    if (bFull) tagB = { name: '大滿貫', multi: 25.0, used: bFull };
    else if (bDragon) tagB = { name: '三龍會', multi: 12.0, used: bDragon };
    else if (b7) tagB = { name: '七連順', multi: 10.0, used: b7 };
    else if (b6) tagB = { name: '六連順', multi: 6.0, used: b6 };
    else if (bDouble4) tagB = { name: '雙順', multi: 6.0, used: bDouble4 };
    else if (b5) tagB = { name: '五連順', multi: 3.5, used: b5 };
    else if (bDouble3) tagB = { name: '雙三連順', multi: 3.0, used: bDouble3 };
    else if (b4) tagB = { name: '四連順', multi: 2.5, used: b4 };
    else if (b3) tagB = { name: '三連順', multi: 2.0, used: b3 };

    // --- 判斷 C 區 ---
    let tagC = { name: '無', multi: 1.0, used: [] };
    let cDStar = getFreqVals(4, 4);
    let cHulu = getFreqVals(5, 3);
    let cStrictPairs = getStrictPairsVals(4);
    let cMidHulu = getFreqVals(4, 3);
    let cAllChows = checkAllChowsVals(counts);
    let cAllPongs = checkAllPongsVals(counts);
    let cChowPong = checkChowPongVals(counts);
    let c4Pairs = getPairsVals(4);
    let cDoubleTrips = getFreqVals(3, 3);
    let cSmallHulu = getFreqVals(3, 2);
    let c3Pairs = getPairsVals(3);
    let c2Pairs = getPairsVals(2);

    if (cDStar) tagC = { name: '雙子星', multi: 20.0, used: cDStar };
    else if (cHulu) tagC = { name: '葫蘆', multi: 15.0, used: cHulu };
    else if (cStrictPairs) tagC = { name: '經典四對子', multi: 10.0, used: cStrictPairs };
    else if (c4Pairs) tagC = { name: '豪華四對子', multi: 15.0, used: c4Pairs };
    else if (cMidHulu) tagC = { name: '中葫蘆', multi: 8.0, used: cMidHulu };
    else if (cAllChows) tagC = { name: '平胡', multi: 6.0, used: cAllChows };
    else if (cAllPongs) tagC = { name: '碰碰胡', multi: 5.0, used: cAllPongs };
    else if (cChowPong) tagC = { name: '順碰交響曲', multi: 4.0, used: cChowPong };
    else if (cDoubleTrips) tagC = { name: '雙三同', multi: 3.5, used: cDoubleTrips };
    else if (cSmallHulu) tagC = { name: '小葫蘆', multi: 3.5, used: cSmallHulu };
    else if (c3Pairs) tagC = { name: '三對子', multi: 3.0, used: c3Pairs };
    else if (c2Pairs) tagC = { name: '雙對子', multi: 2.0, used: c2Pairs };

    // --- 判斷 D 區 ---
    let tagD = { name: '無', multi: 1.0, used: [] };
    let freqs = counts.slice(1).filter(c => c > 0);

    let oddCount = counts[1] + counts[3] + counts[5] + counts[7];
    let evenCount = counts[2] + counts[4] + counts[6] + counts[8];
    let orderReq = playerRelics.includes('order') ? 7 : 8;

    let orderUsed = [];
    if (oddCount >= orderReq) {
        dice.forEach(d => { if(d.val % 2 !== 0) orderUsed.push(d.val); });
    } else if (evenCount >= orderReq) {
        dice.forEach(d => { if(d.val % 2 === 0) orderUsed.push(d.val); });
    }

    if (counts[1] + counts[8] === 8) tagD = { name: '兩極', multi: 30.0, used: dice.map(d=>d.val) };
    else if (oddCount >= orderReq || evenCount >= orderReq) tagD = { name: '絕對秩序', multi: 8.0, used: orderUsed };
    else if (freqs.length === 8) tagD = { name: '全異', multi: 2.5, used: dice.map(d=>d.val) };
    else if (counts[1] === 0 && counts[8] === 0) tagD = { name: '中庸之道', multi: 2.0, used: dice.map(d=>d.val) };

    // --- 總乘區計算 ---
    let globalMulti = 1.0;
    let globalNotes = [];
    let baseABCD = 1.0;

    if (playerRelics.includes('order')) {
        baseABCD = (tagA.multi + tagB.multi) * tagC.multi * tagD.multi;
        globalNotes.push('【絕對秩序】發動: (A+B)*C*D');
    } else {
        baseABCD = tagA.multi * tagB.multi * tagC.multi * tagD.multi;
    }

    // ★ 更新：【雷爪獅的祝福】條件改為場上有 1
    if (playerRelics.includes('pansy') && counts[1] > 0) {
        globalMulti *= 3.0;
        globalNotes.push('【雷爪獅的祝福】 x3.0');
    }

    // ★ 新增：【捧夠的祝福】條件為場上有 8
    if (playerRelics.includes('pongo') && counts[8] > 0) {
        globalMulti *= 3.0;
        globalNotes.push('【捧夠的祝福】 x3.0');
    }

    if (playerRelics.includes('highlow') && counts[1] > 0 && counts[8] > 0) {
        globalMulti *= 1.5;
        globalNotes.push('【高低差】 x1.5');
    }

    if (playerRelics.includes('laststand') && rollsLeft === 0) {
        globalMulti *= 1.5;
        globalNotes.push('【破釜沉舟】 x1.5');
    }

    if (playerRelics.includes('allin') && playerHp === 1) {
        globalMulti *= 2.5;
        globalNotes.push('【孤注一擲】 x2.5');
    }

    let rerollMulti = 1.0 + (rollsLeft * 0.5);
    if (rollsLeft > 0) {
        globalMulti *= rerollMulti;
        globalNotes.push(`剩餘資源加成 (剩 ${rollsLeft} 次) x${rerollMulti.toFixed(1)}`);
    }

    let finalMultiplier = baseABCD * globalMulti;
    let finalScore = totalBase * finalMultiplier;

    return {
        totalBase, tagA, tagB, tagC, tagD, globalMulti, globalNotes, finalMultiplier, finalScore
    };
}