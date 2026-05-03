// AI Fraud Shield - Interaction Layer

document.addEventListener('DOMContentLoaded', () => {
    
    // Simulate Scan button functionality
    const simulateBtn = document.getElementById('simulate-btn');
    const simulateText = document.getElementById('simulate-text');
    const accuracyStat = document.getElementById('accuracy-stat');

    let isScanning = false;
    
    if(simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            if(isScanning) return;
            isScanning = true;
            
            // UI Feedback
            const originalText = simulateText.innerText;
            simulateText.innerText = "Scanning Nodes...";
            simulateBtn.classList.add('animate-pulse');
            
            // Temporarily mock accuracy calculating
            if(accuracyStat) {
                accuracyStat.classList.add('bg-primary/20');
            }

            setTimeout(() => {
                simulateText.innerText = "Anomalies: 0";
                simulateBtn.classList.remove('animate-pulse');
                simulateBtn.classList.replace('from-primary', 'from-tertiary');
                
                if(accuracyStat) {
                    accuracyStat.classList.remove('bg-primary/20');
                    accuracyStat.classList.add('bg-tertiary/20');
                }

                setTimeout(() => {
                    simulateText.innerText = originalText;
                    simulateBtn.classList.replace('from-tertiary', 'from-primary');
                    if(accuracyStat) accuracyStat.classList.remove('bg-tertiary/20');
                    isScanning = false;
                    setTimeout(() => window.location.href = '/simulator/', 500);
                }, 1500);
            }, 1000);
        });
    }

    // 7. Global Connect Wallet Persistent Mock
    const walletBtn = document.getElementById('wallet-btn');
    const savedWallet = localStorage.getItem('ai_fraud_wallet');
    
    if (walletBtn) {
        // Initial load state
        if (savedWallet) {
            walletBtn.innerHTML = `<span class="text-tertiary">🟢</span> ${savedWallet}`;
            walletBtn.classList.add('border', 'border-tertiary', 'shadow-[0_0_15px_rgba(129,236,255,0.4)]');
        }

        walletBtn.addEventListener('click', () => {
            if (localStorage.getItem('ai_fraud_wallet')) {
                // Disconnect action
                localStorage.removeItem('ai_fraud_wallet');
                walletBtn.innerText = `Connect Wallet`;
                walletBtn.classList.remove('border', 'border-tertiary', 'shadow-[0_0_15px_rgba(129,236,255,0.4)]');
                return;
            }

            // Connect action
            walletBtn.innerText = "Connecting...";
            walletBtn.classList.add('opacity-70', 'animate-pulse');
            
            setTimeout(() => {
                const hexChars = '0123456789abcdef';
                let randomHash = '0x';
                for(let i=0; i<4; i++) randomHash += hexChars[Math.floor(Math.random() * 16)];
                randomHash += '...';
                for(let i=0; i<4; i++) randomHash += hexChars[Math.floor(Math.random() * 16)];
                
                localStorage.setItem('ai_fraud_wallet', randomHash);
                
                walletBtn.innerHTML = `<span class="text-tertiary">🟢</span> ${randomHash}`;
                walletBtn.classList.remove('opacity-70', 'animate-pulse');
                walletBtn.classList.add('border', 'border-tertiary', 'shadow-[0_0_15px_rgba(129,236,255,0.4)]');
            }, 1200);
        });
    }

    // Waitlist Form
    const waitlistForm = document.getElementById('waitlist-form');
    if(waitlistForm) {
        waitlistForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-input');
            const userEmail = emailInput.value;
            
            if(userEmail) {
                alert(`Success! ${userEmail} has been added to the alpha waitlist.`);
                emailInput.value = '';
            }
        });
    }

    // ==========================================
    // INJECTED BACKEND/API INTEGRATION LOGIC
    // ==========================================

    const API_URL = 'http://localhost:3000/api';

    // 1. Dashboard Stats Logic
    const fetchDashboardData = async () => {
        try {
            // Fetch stats
            const dashTotal = document.getElementById('dash-total');
            if (dashTotal) {
                const statsResponse = await fetch(`${API_URL}/dashboard/stats`);
                const stats = await statsResponse.json();
                
                document.getElementById('dash-total').innerText = stats.totalTransactions.toLocaleString();
                document.getElementById('dash-fraud').innerText = stats.fraudDetected.toLocaleString();
                document.getElementById('dash-safe').innerText = stats.safeTransactions.toLocaleString();
                document.getElementById('dash-alerts').innerText = stats.alertsTriggered.toLocaleString();
            }

            // Fetch recent transactions
            const txResponse = await fetch(`${API_URL}/transactions/recent`);
            const txData = await txResponse.json();
            
            const tableBody = document.getElementById('dash-history-tbody');
            const fullHistoryBody = document.getElementById('full-history-tbody');
            const simHistoryBody = document.getElementById('sim-history-tbody');
            
            if (tableBody || fullHistoryBody || simHistoryBody) {
                if (tableBody) tableBody.innerHTML = '';
                if (fullHistoryBody) fullHistoryBody.innerHTML = '';
                if (simHistoryBody) simHistoryBody.innerHTML = '';
                
                const filterDropdown = document.getElementById('dashboard-tx-filter');
                const currentFilter = filterDropdown ? filterDropdown.value : 'ALL';

                txData.forEach(tx => {
                    let riskBarColor = "bg-tertiary";
                    let badgeClass = "bg-tertiary/10 text-tertiary border border-tertiary/30";
                    if (tx.decision === "BLOCKED") { riskBarColor = "bg-error"; badgeClass = "bg-error/10 text-error border border-error/30"; }
                    else if (tx.decision === "FLAGGED") { riskBarColor = "bg-yellow-400"; badgeClass = "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"; }
                    
                    let tailwindTextExt = riskBarColor === "bg-yellow-400" ? "text-yellow-400" : (riskBarColor === "bg-error" ? "text-error" : "text-tertiary");

                    const rowHTML = `
                        <td class="px-6 py-4 text-on-surface-variant font-mono text-xs">${tx.timestamp}</td>
                        <td class="px-6 py-4 font-mono text-primary text-xs">${tx.id}</td>
                        <td class="px-6 py-4 font-bold text-xs">${tx.amount}</td>
                        <td class="px-6 py-4 text-xs">
                            <div class="flex items-center gap-2 text-on-surface-variant">
                                <span class="material-symbols-outlined text-xs">public</span> ${tx.location}
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                <div class="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                    <div class="${riskBarColor} h-full" style="width: ${tx.riskScore}%"></div>
                                </div>
                                <span class="${tailwindTextExt} font-bold text-xs">${tx.riskScore}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="${badgeClass} px-3 py-1 rounded-lg text-[10px] font-bold font-headline uppercase tracking-widest">${tx.decision}</span>
                        </td>
                    `;
                    
                    const createRow = () => {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-white/5 transition-colors group';
                        tr.innerHTML = rowHTML;
                        return tr;
                    };
                    
                    if (tableBody) {
                        if (currentFilter === 'ALL' || currentFilter === tx.decision) {
                            tableBody.appendChild(createRow());
                        }
                    }
                    
                    if (fullHistoryBody) {
                        fullHistoryBody.appendChild(createRow());
                    }

                    if (simHistoryBody) {
                        simHistoryBody.appendChild(createRow());
                    }
                });
            }
        } catch (err) {
            console.error("Dashboard API Error:", err);
        }
    };

    const filterDropdown = document.getElementById('dashboard-tx-filter');
    if (filterDropdown) {
        filterDropdown.addEventListener('change', fetchDashboardData);
    }

    fetchDashboardData();
    setInterval(fetchDashboardData, 5000); // Poll every 5 seconds

    // 2. Simulator Scan Logic
    const simForm = document.getElementById('sim-form');
    if (simForm) {
        // Tie range input to text input (amount)
        const simAmtText = document.querySelector('input[type="number"]');
        const simAmtSlider = document.querySelector('input[type="range"][max="10000"]');
        if(simAmtText && simAmtSlider) {
            simAmtSlider.addEventListener('input', (e) => simAmtText.value = e.target.value);
            simAmtText.addEventListener('input', (e) => simAmtSlider.value = e.target.value);
        }

        const simFreqSlider = document.querySelectorAll('input[type="range"]')[1];
        const simFreqLabel = simFreqSlider ? simFreqSlider.parentElement.querySelector('.text-tertiary') : null;
        if (simFreqSlider && simFreqLabel) {
            simFreqSlider.addEventListener('input', (e) => simFreqLabel.innerText = `${e.target.value} Requests`);
        }

        // OTP Logic Setup
        const otpModal = document.getElementById('otp-modal');
        const otpForm = document.getElementById('otp-form');
        const otpCancel = document.getElementById('otp-cancel');
        const otpInputs = document.querySelectorAll('.otp-input');
        
        if (otpInputs.length > 0) {
            otpInputs.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    if (e.target.value && index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value && index > 0) {
                        otpInputs[index - 1].focus();
                    }
                });
            });
        }

        if (otpCancel) {
            otpCancel.addEventListener('click', async () => {
                otpModal.classList.add('hidden');
                const badge = document.getElementById('live-decision-badge');
                if (badge) badge.className = "border px-8 py-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.3)] bg-error/10 border-error/40";
                const dt = document.getElementById('live-decision-text');
                if(dt) {
                    dt.innerText = "BLOCKED BY USER";
                    dt.className = "text-2xl font-headline font-black text-error italic tracking-widest";
                }
                
                const targetId = otpModal.getAttribute('data-target');
                if (targetId) {
                    const rowBadge = document.getElementById(`badge-${targetId}`);
                    if (rowBadge) {
                        rowBadge.className = "bg-error/10 text-error px-3 py-1 rounded-full text-[10px] font-bold font-headline";
                        rowBadge.innerText = "BLOCK";
                    }
                    
                    try {
                        await fetch(`${API_URL}/transactions/${targetId}/resolve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: "BLOCKED" })
                        });
                    } catch(e) { console.error("OTP Sync Error", e) }
                }
            });
        }

        if (otpForm) {
            otpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const targetOtp = otpModal.getAttribute('data-correct-otp');
                const userOtp = Array.from(otpInputs).map(i => i.value).join('');
                if (userOtp !== targetOtp) {
                    otpInputs.forEach(i => {
                        i.classList.add('border-error');
                        setTimeout(() => i.classList.remove('border-error'), 800);
                    });
                    return; // Fail validation, do not close modal
                }

                otpModal.classList.add('hidden');
                const badge = document.getElementById('live-decision-badge');
                if (badge) badge.className = "border px-8 py-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.3)] bg-tertiary/10 border-tertiary/40";
                const dt = document.getElementById('live-decision-text');
                if(dt) {
                    dt.innerText = "OTP VERIFIED";
                    dt.className = "text-2xl font-headline font-black text-tertiary italic tracking-widest";
                }
                otpInputs.forEach(i => i.value = '');
                
                const targetId = otpModal.getAttribute('data-target');
                if (targetId) {
                    const rowBadge = document.getElementById(`badge-${targetId}`);
                    if (rowBadge) {
                        rowBadge.className = "bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold font-headline";
                        rowBadge.innerText = "ALLOW";
                    }
                    
                    try {
                        await fetch(`${API_URL}/transactions/${targetId}/resolve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: "APPROVED" })
                        });
                    } catch(e) { console.error("OTP Sync Error", e) }
                }
            });
        }

        simForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = simForm.querySelector('button[type="submit"] span');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Analyzing Neural Pathways...";

            const amount = simAmtText?.value || 0;
            const location = document.querySelector('select')?.value || "USA";
            const frequency = simFreqSlider?.value || 1;
            const ip = document.querySelector('input[type="text"][placeholder="0.0.0.0"]')?.value || "192.168.1.1";

            const liveRiskScore = document.getElementById('live-risk-score');
            const liveDecisionBadge = document.getElementById('live-decision-badge');
            const liveDecisionText = document.getElementById('live-decision-text');
            const liveReasonsContainer = document.getElementById('live-reasons-container');
            const liveReasonsBadges = document.getElementById('live-reasons-badges');

            if(liveRiskScore) liveRiskScore.innerText = "++";

            try {
                const response = await fetch(`${API_URL}/scan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, location, frequency, ip, device: 'Desktop' })
                });

                const data = await response.json();
                
                // Update UI based on API JSON Res
                if(liveRiskScore) liveRiskScore.innerText = data.riskScore;

                if (liveDecisionBadge && liveDecisionText) {
                    liveDecisionBadge.className = "border px-8 py-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.3)] ";
                    if (data.decision === "BLOCKED") {
                        liveDecisionBadge.classList.add('bg-error/10', 'border-error/40');
                        liveDecisionText.className = "text-2xl font-headline font-black text-error italic tracking-widest";
                        liveDecisionText.innerText = "BLOCK TRANSACTION";
                    } else if (data.decision === "FLAGGED") {
                        liveDecisionBadge.classList.add('bg-yellow-400/10', 'border-yellow-400/40');
                        liveDecisionText.className = "text-2xl font-headline font-black text-yellow-400 italic tracking-widest";
                        liveDecisionText.innerText = "REVIEW REQUIRED";
                        
                        if (otpModal) {
                            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
                            otpModal.setAttribute('data-target', data.id.replace('#', ''));
                            otpModal.setAttribute('data-correct-otp', newOtp);
                            
                            const otpHint = document.getElementById('otp-hint');
                            if (otpHint) {
                                otpHint.innerText = `Simulation OTP: ${newOtp}`;
                                otpHint.classList.remove('hidden');
                            }
                            
                            otpModal.classList.remove('hidden');
                            if(otpInputs.length > 0) setTimeout(() => otpInputs[0].focus(), 100);
                        }
                    } else {
                        liveDecisionBadge.classList.add('bg-tertiary/10', 'border-tertiary/40');
                        liveDecisionText.className = "text-2xl font-headline font-black text-tertiary italic tracking-widest";
                        liveDecisionText.innerText = "APPROVED";
                    }
                }

                if (liveReasonsContainer && liveReasonsBadges) {
                    liveReasonsContainer.querySelector('p').innerText = "Dynamic Analysis from Neural Engine completed. Identified signatures below.";
                    liveReasonsBadges.innerHTML = "";
                    data.reasons.forEach(r => {
                        const span = document.createElement('span');
                        span.className = "bg-surface-container-highest px-3 py-1 rounded-full text-[10px] font-headline text-on-surface-variant";
                        span.innerText = r;
                        liveReasonsBadges.appendChild(span);
                    });
                }

                // Add to table
                const tableBody = document.getElementById('sim-history-tbody');
                if (tableBody) {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-white/5 transition-colors group';
                    
                    let riskBarColor = "bg-tertiary";
                    let badgeClass = "bg-tertiary/10 text-tertiary";
                    if (data.decision === "BLOCKED") { riskBarColor = "bg-error"; badgeClass = "bg-error/10 text-error"; }
                    else if (data.decision === "FLAGGED") { riskBarColor = "bg-yellow-400"; badgeClass = "bg-yellow-400/10 text-yellow-400"; }
                    
                    let tailwindTextExt = riskBarColor === "bg-yellow-400" ? "text-yellow-400" : (riskBarColor === "bg-error" ? "text-error" : "text-tertiary");

                    tr.innerHTML = `
                        <td class="px-6 py-4 text-on-surface-variant font-mono">${data.timestamp}</td>
                        <td class="px-6 py-4 font-mono">${data.id}</td>
                        <td class="px-6 py-4">${data.amount}</td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2 text-on-surface-variant text-sm">
                                <span class="material-symbols-outlined text-sm">public</span> ${data.location}
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                <div class="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                    <div class="${riskBarColor} h-full" style="width: ${data.riskScore}%"></div>
                                </div>
                                <span class="${tailwindTextExt} font-bold">${data.riskScore}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span id="badge-${data.id.replace('#', '')}" class="${badgeClass} px-3 py-1 rounded-full text-[10px] font-bold font-headline">${data.decision}</span>
                        </td>
                    `;
                    tableBody.prepend(tr); // Add to top
                }

            } catch (err) {
                console.error("API Error:", err);
                if(liveRiskScore) liveRiskScore.innerText = "ERR";
            } finally {
                submitBtn.innerText = originalBtnText;
            }
        });
    }

    // 3. Settings API Hook
    const settingsSlider = document.getElementById('settings-strictness-slider');
    const settingsVal = document.getElementById('settings-strictness-val');
    const settingsBulk = document.getElementById('settings-bulk-toggle');
    const settingsSaveBtn = document.getElementById('settings-save-btn');
    const settingsSaveMsg = document.getElementById('settings-save-msg');

    if (settingsSlider && settingsSaveBtn) {
        // Fetch current settings on load
        fetch(`${API_URL}/settings`)
            .then(res => res.json())
            .then(data => {
                settingsSlider.value = data.strictnessLevel;
                if(settingsVal) settingsVal.innerText = data.strictnessLevel;
                if (settingsBulk) settingsBulk.checked = data.alertOnBulk;
            }).catch(console.error);

        settingsSlider.addEventListener('input', (e) => {
            if(settingsVal) settingsVal.innerText = e.target.value;
        });

        settingsSaveBtn.addEventListener('click', async () => {
            const payload = {
                strictnessLevel: settingsSlider.value,
                alertOnBulk: settingsBulk ? settingsBulk.checked : true
            };
            try {
                await fetch(`${API_URL}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                settingsSaveMsg.classList.remove('opacity-0');
                setTimeout(() => settingsSaveMsg.classList.add('opacity-0'), 2500);
            } catch(e) {
                console.error('Settings save failed', e);
            }
        });
    }

    // 4. Analytics Chart Logic
    const canvasIds = ['analytics-chart-canvas'];
    let charts = [];

    const fetchAnalyticsData = async () => {
        if (!window.Chart) return;
        try {
            const res = await fetch(`${API_URL}/dashboard/analytics`);
            const data = await res.json();
            
            if (charts.length > 0) {
                charts.forEach(chart => {
                    chart.data.datasets[0].data = data.map(d => d.activeScans);
                    chart.data.datasets[1].data = data.map(d => d.flagged);
                    chart.update();
                });
            } else {
                canvasIds.forEach(id => {
                    const canvas = document.getElementById(id);
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        charts.push(new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: data.map(d => d.hour),
                                datasets: [
                                    {
                                        label: 'Threat Scans Evaluated',
                                        data: data.map(d => d.activeScans),
                                        borderColor: '#9ba8ff',
                                        backgroundColor: 'rgba(155, 168, 255, 0.1)',
                                        tension: 0.4,
                                        fill: true,
                                        pointBackgroundColor: '#16052a'
                                    },
                                    {
                                        label: 'Fraud Anomalies Flagged',
                                        data: data.map(d => d.flagged),
                                        borderColor: '#ff6e84',
                                        backgroundColor: 'rgba(255, 110, 132, 0.1)',
                                        tension: 0.4,
                                        fill: true,
                                        borderDash: [5, 5]
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                color: '#b9a2d0',
                                plugins: {
                                    legend: { labels: { color: '#f1dfff', font: {family: 'Space Grotesk'} } }
                                },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#b9a2d0' } },
                                    x: { grid: { display: false }, ticks: { color: '#b9a2d0', font: {family: 'Inter'} } }
                                }
                            }
                        }));
                    }
                });
            }
            
            // Build the visual CSS Bar Chart in the Dashboard Overview tab
            const barContainer = document.getElementById('overview-bar-chart');
            const labelsContainer = document.getElementById('overview-bar-labels');
            if (barContainer && labelsContainer) {
                barContainer.innerHTML = '';
                labelsContainer.innerHTML = '';
                
                let maxScans = Math.max(...data.map(d => d.activeScans), 1);
                
                data.forEach((d) => {
                    let heightPct = Math.min((d.activeScans / maxScans) * 100, 100);
                    if (heightPct < 5 && d.activeScans > 0) heightPct = 5;
                    if (d.activeScans === 0) heightPct = 2; // give a tiny base for empty slots
                    
                    let isSpike = d.flagged > 1000;
                    
                    let barClass = "bg-gradient-to-t from-primary/40 to-primary";
                    let tooltipHTML = `<div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-bright px-2 py-1 rounded text-[10px] font-bold transition-opacity whitespace-nowrap z-20">${d.activeScans} Tx</div>`;
                    
                    if (isSpike) {
                        barClass = "bg-gradient-to-t from-secondary/40 to-secondary border-t-2 border-secondary shadow-[0_0_15px_rgba(233,102,255,0.4)]";
                        tooltipHTML = `<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary px-2 py-1 rounded text-[10px] text-on-secondary font-bold whitespace-nowrap z-20">SPIKE: ${d.flagged} BLOCKED</div>`;
                    }

                    barContainer.innerHTML += `
                        <div class="flex-1 ${barClass} rounded-t-sm relative group transition-all duration-500 ease-out" style="height: ${heightPct}%">
                            ${tooltipHTML}
                        </div>
                    `;
                    
                    // Show roughly every other label for fit
                    labelsContainer.innerHTML += `<span>${d.hour}</span>`;
                });
            }
        } catch(e) { console.error("Chart fetch err", e); }
    };
    
    // Inject fetchAnalyticsData into the global dashboard interval
    const originalFetchDashboard = window.fetchDashboardData;
    window.fetchDashboardData = async () => {
        if (originalFetchDashboard) await originalFetchDashboard();
        await fetchAnalyticsData();
    };
    fetchAnalyticsData();

    // 5. Shield Status Dancing Logic
    const statCompute = document.getElementById('shield-stat-compute');
    const statLatency = document.getElementById('shield-stat-latency');
    const statQueries = document.getElementById('shield-stat-queries');
    if (statCompute) {
        setInterval(() => {
            statCompute.innerText = `${Math.floor(20 + Math.random() * 15)}% Load`;
            statLatency.innerText = `${Math.floor(10 + Math.random() * 8)}ms`;
            statQueries.innerText = `${Math.floor(120 + Math.random() * 40)}/sec`;
        }, 2000);
    }

    // 6. Router Link Integration
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const targetTab = document.querySelector(`.sidebar-tab[data-target="${hash}"]`) || document.querySelector(`.top-tab[data-target="${hash}"]`);
        if (targetTab && typeof targetTab.click === 'function') {
            setTimeout(() => targetTab.click(), 100);
        }
    }

});
