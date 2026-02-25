/* ============================================
   FC Sporting Sale Ocelots - Site JavaScript
   Season filtering, tabs, navigation, animations,
   dynamic player stats from CSV, expandable league table
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Mobile Navigation ----
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ---- Scroll reveal animation ----
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll(
    '.stat-card, .player-card, .data-table-container, .match-card'
  );

  animateElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
    observer.observe(el);
  });

  // ---- Load player stats from CSV ----
  if (document.getElementById('statsTableBody')) {
    loadPlayerStats();
  }

  // ---- Load dynamic league data ----
  loadLeagueData();
});


// =============================================
// CSV PARSER & DYNAMIC PLAYER STATS
// =============================================

/**
 * Parse CSV text into an array of objects
 */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, j) => row[h] = values[j]);
      rows.push(row);
    }
  }
  return rows;
}

/**
 * Load player stats from CSV and render both stats table and player cards
 */
async function loadPlayerStats() {
  try {
    const response = await fetch('player_stats.csv?v=' + Date.now());
    if (!response.ok) throw new Error('CSV not found');
    const text = await response.text();
    const players = parseCSV(text);

    renderStatsTable(players);
    renderPlayerCards(players);
  } catch (err) {
    console.warn('Could not load player_stats.csv:', err);
    const tbody = document.getElementById('statsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--muted-blue);">
        Player stats will appear here once player_stats.csv is available.</td></tr>`;
    }
  }
}

/**
 * Render the stats table from player data
 */
function renderStatsTable(players) {
  const tbody = document.getElementById('statsTableBody');
  if (!tbody) return;

  // Sort: outfield by goals desc, then GKs by clean sheets desc
  const sorted = [...players].sort((a, b) => {
    const aIsGK = (a.Position || '').toLowerCase() === 'goalkeeper';
    const bIsGK = (b.Position || '').toLowerCase() === 'goalkeeper';
    // Outfield players first, sorted by goals then matches
    if (!aIsGK && !bIsGK) {
      const goalDiff = (parseInt(b.Goals) || 0) - (parseInt(a.Goals) || 0);
      if (goalDiff !== 0) return goalDiff;
      return (parseInt(b.Matches) || 0) - (parseInt(a.Matches) || 0);
    }
    // GKs after outfield, sorted by clean sheets then matches
    if (aIsGK && bIsGK) {
      const csDiff = (parseInt(b.CleanSheets) || 0) - (parseInt(a.CleanSheets) || 0);
      if (csDiff !== 0) return csDiff;
      return (parseInt(b.Matches) || 0) - (parseInt(a.Matches) || 0);
    }
    return aIsGK ? 1 : -1;
  });

  // Calculate totals
  const totalMatches = players.reduce((sum, p) => sum + (parseInt(p.Matches) || 0), 0);
  const totalGoals = players.reduce((sum, p) => sum + (parseInt(p.Goals) || 0), 0);
  const totalCS = players.reduce((sum, p) => sum + (parseInt(p.CleanSheets) || 0), 0);

  tbody.innerHTML = sorted.map(player => {
    const num = player.Number || '';
    const name = player.Name || '';
    const pos = player.Position || '';
    const matches = player.Matches || '0';
    const isGK = pos.toLowerCase() === 'goalkeeper';
    const posClass = pos.toLowerCase().replace(/[\s\/]+/g, '-');

    let lastCol;
    if (isGK) {
      const cs = player.CleanSheets || '0';
      lastCol = `<span title="Clean Sheets">🧤 ${parseInt(cs) > 0 ? '<strong>' + cs + '</strong>' : cs}</span>`;
    } else {
      const goals = player.Goals || '0';
      lastCol = parseInt(goals) > 0 ? '<strong>' + goals + '</strong>' : goals;
    }

    return `<tr>
      <td><span class="shirt-number">${num}</span></td>
      <td><strong>${name}</strong></td>
      <td><span class="position-badge ${posClass}">${pos}</span></td>
      <td>${matches}</td>
      <td>${lastCol}</td>
    </tr>`;
  }).join('');

  // Add totals row
  tbody.innerHTML += `<tr class="stats-total-row">
    <td></td>
    <td><strong>SQUAD TOTALS</strong></td>
    <td></td>
    <td><strong>${totalMatches}</strong></td>
    <td><strong>${totalGoals}</strong> goals &nbsp;/&nbsp; <strong>${totalCS}</strong> 🧤</td>
  </tr>`;
}

/**
 * Render player cards from player data
 */
function renderPlayerCards(players) {
  const grid = document.getElementById('playersGrid');
  if (!grid) return;

  const avatarSVG = `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>`;

  grid.innerHTML = players.map(player => {
    const num = player.Number || '';
    const name = player.Name || '';
    const pos = player.Position || '';
    const matches = player.Matches || '0';
    const isGK = pos.toLowerCase() === 'goalkeeper';

    let statLine;
    if (isGK) {
      const cs = player.CleanSheets || '0';
      statLine = `<span>&#9917; ${matches} matches</span><span>&#129351; ${cs} clean sheets</span>`;
    } else {
      const goals = player.Goals || '0';
      statLine = `<span>&#9917; ${matches} matches</span><span>&#129349; ${goals} goals</span>`;
    }

    return `<div class="player-card">
      <div class="player-photo">
        <div class="placeholder-avatar">${avatarSVG}</div>
        <div class="player-number">#${num}</div>
        <div class="player-position-badge">${pos}</div>
      </div>
      <div class="player-info">
        <h3 class="player-name">${name}</h3>
        <div class="player-stats-mini">
          ${statLine}
        </div>
      </div>
    </div>`;
  }).join('');
}


// =============================================
// DYNAMIC LEAGUE TABLE FROM FA WIDGETS
// =============================================

const LRCODES = [
  '576244793', '815638487', '250924100', '101502575', '917798922',
  '356684596', '326447245', '521104137', '79101590', '927626414'
];

const OUR_TEAM = 'FC Sporting Sale U12 Ocelots';

/**
 * Load all 10 FA widgets in hidden iframes to bypass CORS and extract real-time data
 */
async function loadLeagueData() {
  try {
    const promises = LRCODES.map(code => loadFASnippet(code));
    const allData = await Promise.all(promises);

    let allResults = [];
    let allFixtures = [];

    allData.forEach(d => {
      if (d.results) allResults.push(...d.results);
      if (d.fixtures) allFixtures.push(...d.fixtures);
    });

    // Deduplicate cross-referenced matches (since 2 teams play each other they appear in 2 widgets)
    const uniqueResults = deduplicateMatches(allResults);
    const uniqueFixtures = deduplicateMatches(allFixtures);

    // Filter to just League and Division type matches for the main table (exclude Cups)
    const leagueResults = uniqueResults.filter(m => m.type === 'L' || m.type === 'D');

    // The Ocelots specific matches for the cards
    const ocelotsLeagueResults = leagueResults.filter(m => m.home.includes(OUR_TEAM) || m.away.includes(OUR_TEAM));
    const ocelotsLeagueFixtures = uniqueFixtures.filter(m =>
      (m.type === 'L' || m.type === 'D') && (m.home.includes(OUR_TEAM) || m.away.includes(OUR_TEAM))
    );

    const table = computeLeagueTable(leagueResults);
    renderLeagueTable(table, OUR_TEAM);
    renderMatchCards(ocelotsLeagueResults, OUR_TEAM, 'resultsContainer');
    renderFixtureCards(ocelotsLeagueFixtures, OUR_TEAM, 'fixturesContainer');

    // The Ocelots specific CUP matches
    const cupResults = uniqueResults.filter(m => m.type.startsWith('C') || m.type.toLowerCase().includes('cup'));
    const ocelotsCupResults = cupResults.filter(m => m.home.includes(OUR_TEAM) || m.away.includes(OUR_TEAM));

    const cupFixtures = uniqueFixtures.filter(m => m.type.startsWith('C') || m.type.toLowerCase().includes('cup'));
    const ocelotsCupFixtures = cupFixtures.filter(m => m.home.includes(OUR_TEAM) || m.away.includes(OUR_TEAM));

    renderMatchCards(ocelotsCupResults, OUR_TEAM, 'cupResultsContainer');
    renderFixtureCards(ocelotsCupFixtures, OUR_TEAM, 'cupFixturesContainer');

    setupExpandableTable();

  } catch (err) {
    console.error('Error auto-loading FA Widget data:', err);
    document.getElementById('leagueTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Failed to pull FA Full-Time data automatically.</td></tr>';
  }
}

/**
 * Creates an iframe to execute the FA document.write securely and polls until parsed
 */
function loadFASnippet(lrcode) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Get iframe document
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html><body>
      <div id="lrep${lrcode}">Data loading...</div>
      <script>var lrcode = '${lrcode}';</script>
      <script src="https://fulltime.thefa.com/client/api/cs1.js"></script>
      </body></html>
    `);
    doc.close();

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const container = doc.getElementById('lrep' + lrcode);
      if (container) {
        const html = container.innerHTML;
        if (html && !html.includes('Data loading')) {
          clearInterval(interval);
          const rows = Array.from(container.querySelectorAll('tr'));
          const parsedData = parseFARows(rows);
          document.body.removeChild(iframe);
          resolve(parsedData);
        }
      }

      // Timeout after 10 seconds per widget
      if (attempts > 100) {
        clearInterval(interval);
        document.body.removeChild(iframe);
        console.warn('Timeout loading FA snippet ' + lrcode);
        resolve({ results: [], fixtures: [] });
      }
    }, 100);
  });
}

/**
 * Extract data from the FA HTML table rows
 */
function parseFARows(rows) {
  const results = [];
  const fixtures = [];
  let currentDate = null;

  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td, th'));

    // Date row (has colspan)
    if (cells.length === 1 && cells[0].colSpan > 1) {
      currentDate = cells[0].textContent.trim();
    }
    // Match row (has several columns)
    else if (cells.length >= 7) {
      const type = cells[0].textContent.trim();
      let home = cells[1].textContent.trim();
      const hScore = cells[2].textContent.trim();
      const sep = cells[3].textContent.trim();
      const aScore = cells[4].textContent.trim();
      let away = cells[5].textContent.trim();

      // Clean (P2) or (P1) venue indicators from team names if present
      home = home.replace(/\s+\(P\d+\)$/i, '').trim();
      away = away.replace(/\s+\(P\d+\)$/i, '').trim();

      // Ensure we parse scores, accepting A, H, W for walkovers
      let hs = NaN;
      let as = NaN;

      if (hScore === 'A' && aScore === 'W') {
        hs = 'A';
        as = 'W';
      } else if (hScore === 'H' && aScore === 'W') {
        hs = 'H';
        as = 'W';
      } else {
        hs = parseInt(hScore);
        as = parseInt(aScore);
      }

      const matchObj = {
        date: currentDate,
        type: type,
        home: home,
        homeScore: hs,
        awayScore: as,
        away: away
      };

      if (sep === '-' && hScore !== '' && aScore !== '' && (hs === 'A' || hs === 'H' || !isNaN(hs))) {
        results.push(matchObj);
      } else {
        fixtures.push(matchObj);
      }
    }
  });

  return { results, fixtures };
}

/**
 * Ensure we only process each unique match once by generating a hash key
 */
function deduplicateMatches(matches) {
  const map = new Map();
  matches.forEach(m => {
    // Normalizing names removes minor variations exactly like FA Full Time
    const h = m.home.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = m.away.toLowerCase().replace(/[^a-z0-9]/g, '');
    const datePart = m.date.substring(0, 15); // e.g., "Sun 19 Oct 2025"

    const key = `${datePart}-${h}-${a}`;
    if (!map.has(key)) {
      map.set(key, m);
    }
  });
  return Array.from(map.values());
}

/**
 * Compute full league table from results array
 */
function computeLeagueTable(results) {
  const teams = {};

  const getTeam = (name) => {
    if (!teams[name]) {
      teams[name] = {
        name, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0,
        hp: 0, hw: 0, hd: 0, hl: 0, hf: 0, ha: 0,
        ap: 0, aw: 0, ad: 0, al: 0, af: 0, aa: 0,
        pts: 0
      };
    }
    return teams[name];
  };

  results.forEach(match => {
    const home = getTeam(match.home);
    const away = getTeam(match.away);
    let hs, as;

    // Handle walkovers (A-W, H-W)
    if (match.homeScore === 'A' && match.awayScore === 'W') {
      hs = 0; as = 3;  // Away team gets 3-0 win
    } else if (match.homeScore === 'H' && match.awayScore === 'W') {
      hs = 3; as = 0;  // Home team gets 3-0 win
    } else {
      hs = match.homeScore;
      as = match.awayScore;
    }

    // Overall
    home.p++; away.p++;
    home.f += hs; home.a += as;
    away.f += as; away.a += hs;

    // Home/Away
    home.hp++; home.hf += hs; home.ha += as;
    away.ap++; away.af += as; away.aa += hs;

    if (hs > as) {
      home.w++; home.hw++; home.pts += 3;
      away.l++; away.al++;
    } else if (hs < as) {
      away.w++; away.aw++; away.pts += 3;
      home.l++; home.hl++;
    } else {
      home.d++; home.hd++; home.pts += 1;
      away.d++; away.ad++; away.pts += 1;
    }
  });

  // Sort: pts desc, then GD desc, then GF desc, then name
  return Object.values(teams).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.f - a.a, gdB = b.f - b.a;
    if (gdB !== gdA) return gdB - gdA;
    if (b.f !== a.f) return b.f - a.f;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Render the league table with expandable home/away rows
 */
function renderLeagueTable(table, ourTeam) {
  const tbody = document.getElementById('leagueTableBody');
  if (!tbody) return;

  const fmt = (n) => (n >= 0 ? '+' : '') + n;

  tbody.innerHTML = table.map((t, i) => {
    const pos = i + 1;
    const gd = t.f - t.a;
    const hgd = t.hf - t.ha;
    const agd = t.af - t.aa;
    const isOurs = t.name === ourTeam;
    const rowClass = isOurs ? ' class="our-team"' : '';
    const detailClass = isOurs ? ' our-team' : '';
    const icon = isOurs ? '&#9917; ' : '';

    return `<tr${rowClass}>
      <td>${pos}</td>
      <td>${icon}${t.name}</td>
      <td>${t.p}</td>
      <td>${t.w}</td>
      <td>${t.d}</td>
      <td>${t.l}</td>
      <td>${t.f}</td>
      <td>${t.a}</td>
      <td>${fmt(gd)}</td>
      <td><strong>${t.pts}</strong></td>
    </tr>
    <tr class="detail-row${detailClass}">
      <td></td>
      <td colspan="9" class="detail-cell">
        <span class="detail-label">Home:</span> P${t.hp} W${t.hw} D${t.hd} L${t.hl} (GD ${fmt(hgd)})
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="detail-label">Away:</span> P${t.ap} W${t.aw} D${t.ad} L${t.al} (GD ${fmt(agd)})
      </td>
    </tr>`;
  }).join('');
}

/**
 * Render match result cards
 */
function renderMatchCards(results, ourTeam, containerId = 'resultsContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Sort by date descending (most recent first)
  const sorted = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(match => {
    const homeHL = match.home === ourTeam ? ' highlight' : '';
    const awayHL = match.away === ourTeam ? ' highlight' : '';
    const d = new Date(match.date);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return `<div class="match-card">
      <div class="match-team home${homeHL}">${match.home}</div>
      <div>
        <div class="match-score">${match.homeScore} - ${match.awayScore}</div>
        <div class="match-date" style="text-align:center;">${dateStr}</div>
      </div>
      <div class="match-team away${awayHL}">${match.away}</div>
    </div>`;
  }).join('');
}

/**
 * Render fixture cards
 */
function renderFixtureCards(fixtures, ourTeam, containerId = 'fixturesContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Sort by date ascending (soonest first)
  const sorted = [...fixtures].sort((a, b) => new Date(a.date) - new Date(b.date));

  container.innerHTML = sorted.map(match => {
    const homeHL = match.home === ourTeam ? ' highlight' : '';
    const awayHL = match.away === ourTeam ? ' highlight' : '';
    const d = new Date(match.date);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return `<div class="match-card">
      <div class="match-team home${homeHL}">${match.home}</div>
      <div>
        <div class="match-score pending">TBC</div>
        <div class="match-date" style="text-align:center;">${dateStr}</div>
      </div>
      <div class="match-team away${awayHL}">${match.away}</div>
    </div>`;
  }).join('');

  if (sorted.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:24px; color:var(--muted-blue);">No upcoming fixtures scheduled.</p>';
  }
}

/**
 * Setup expandable rows on the league table
 */
function setupExpandableTable() {
  const table = document.querySelector('#league-table-2025 .data-table');
  if (!table) return;

  const container = table.closest('.data-table-container');
  if (!container) return;

  // Remove any existing toggle button
  const existing = container.querySelector('.expand-table-btn');
  if (existing) existing.remove();

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'expand-table-btn';
  toggleBtn.innerHTML = '&#9660; Show Home / Away Breakdown';
  toggleBtn.setAttribute('aria-expanded', 'false');

  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const detailRows = table.querySelectorAll('.detail-row');

    if (expanded) {
      detailRows.forEach(r => r.style.display = 'none');
      toggleBtn.innerHTML = '&#9660; Show Home / Away Breakdown';
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      detailRows.forEach(r => r.style.display = '');
      toggleBtn.innerHTML = '&#9650; Hide Home / Away Breakdown';
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  container.appendChild(toggleBtn);

  // Detail rows hidden by default
  const detailRows = table.querySelectorAll('.detail-row');
  detailRows.forEach(r => r.style.display = 'none');
}


// =============================================
// SEASON FILTER & TABS
// =============================================

/**
 * Season Filter
 */
function filterSeason(competition, season) {
  const allSeasons = document.querySelectorAll(
    `.season-data[data-competition="${competition}"]`
  );
  allSeasons.forEach(el => el.classList.remove('active'));

  const selected = document.querySelector(
    `.season-data[data-competition="${competition}"][data-season="${season}"]`
  );
  if (selected) {
    selected.classList.add('active');
    const firstTab = selected.querySelector('.tab-btn');
    if (firstTab) firstTab.click();
  }
}

/**
 * Tab Switching
 */
function switchTab(btn, tabId) {
  const tabNav = btn.closest('.tab-nav');
  const seasonContainer = btn.closest('.season-data');

  if (!tabNav || !seasonContainer) return;

  tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  seasonContainer.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
  }
}
