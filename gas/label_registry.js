/****************************************************
 * label_registry.gs
 * ==================================================
 * Script Properties に保存するラベルレジストリの管理
 ****************************************************/

const CALENDAR_LABEL_REGISTRY_PROPERTY_KEY = "CALENDAR_LABEL_REGISTRY_JSON";

// ラベル名比較用のキーへ正規化する。
function normalizeCalendarLabelNameKey_(labelName) {
  return String(labelName || "").trim().toLowerCase();
}

// colorId が空の予定へ割り当てる特別ラベル名かどうかを判定する。
function isDefaultCalendarLabelName_(labelName) {
  return normalizeCalendarLabelNameKey_(labelName) === normalizeCalendarLabelNameKey_("デフォルト");
}

// レジストリが空のときの既定値を返す。
function createEmptyCalendarLabelRegistry_() {
  return {
    version: 1,
    updatedAt: "",
    entriesByNameKey: {}
  };
}

// config_labels.js のシード設定を読みやすい形へ整える。
function getCalendarLabelRegistrySeeds_() {
  if (typeof CALENDAR_LABEL_REGISTRY_SEEDS === "undefined" || !Array.isArray(CALENDAR_LABEL_REGISTRY_SEEDS)) {
    return [];
  }

  return CALENDAR_LABEL_REGISTRY_SEEDS
    .map(function(seed) {
      if (!seed) {
        return null;
      }

      const labelName = String(seed.labelName || "").trim();
      const sampleEventTitle = String(seed.sampleEventTitle || "").trim();
      const sampleDate = isBlank_(seed.sampleDate) ? "" : String(seed.sampleDate).trim();

      if (!labelName || !sampleEventTitle) {
        return null;
      }

      return {
        labelName: labelName,
        labelNameKey: normalizeCalendarLabelNameKey_(labelName),
        sampleEventTitle: sampleEventTitle,
        sampleDate: sampleDate
      };
    })
    .filter(function(seed) {
      return !!seed;
    });
}


// config_labels.js 上で定義されたラベル名一覧を重複なしで返す。
function getConfiguredCalendarLabelNames_() {
  const labelNames = [];
  const seen = {};

  normalizeStringList_(typeof CALENDAR_REMINDER_LABELS === "undefined" ? [] : CALENDAR_REMINDER_LABELS).forEach(function(labelName) {
    const key = normalizeCalendarLabelNameKey_(labelName);

    if (!key || seen[key]) {
      return;
    }

    seen[key] = true;
    labelNames.push(labelName);
  });

  getCalendarLabelRegistrySeeds_().forEach(function(seed) {
    if (!seed || !seed.labelNameKey || seen[seed.labelNameKey]) {
      return;
    }

    seen[seed.labelNameKey] = true;
    labelNames.push(seed.labelName);
  });

  return labelNames;
}

// Script Properties から保存済みレジストリを読む。
function getStoredCalendarLabelRegistry_() {
  const raw = PropertiesService.getScriptProperties().getProperty(CALENDAR_LABEL_REGISTRY_PROPERTY_KEY);

  if (isBlank_(raw)) {
    return createEmptyCalendarLabelRegistry_();
  }

  try {
    const parsed = JSON.parse(raw);
    const registry = createEmptyCalendarLabelRegistry_();

    registry.version = parsed.version || 1;
    registry.updatedAt = String(parsed.updatedAt || "");
    registry.entriesByNameKey = parsed.entriesByNameKey || {};
    return registry;
  } catch (error) {
    Logger.log("getStoredCalendarLabelRegistry_: 保存済みJSONの解析に失敗したため空レジストリへ戻します。reason=" + error.message);
    return createEmptyCalendarLabelRegistry_();
  }
}

// Script Properties へレジストリを書き戻す。
function saveCalendarLabelRegistry_(registry) {
  registry.updatedAt = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty(
    CALENDAR_LABEL_REGISTRY_PROPERTY_KEY,
    JSON.stringify(registry)
  );
}

// 保存済みレジストリを空に戻す。
function clearStoredCalendarLabelRegistry_() {
  PropertiesService.getScriptProperties().deleteProperty(CALENDAR_LABEL_REGISTRY_PROPERTY_KEY);
}

// ラベル定義1件分の既定オブジェクトを返す。
function createCalendarLabelRegistryEntry_(labelName) {
  return {
    labelName: String(labelName || "").trim(),
    colorId: "",
    sampleEventTitle: "",
    sampleDate: "",
    source: "",
    lastSyncedAt: ""
  };
}

// レジストリへ1件分の情報を上書き登録する。
function upsertCalendarLabelRegistryEntry_(registry, partialEntry) {
  const labelName = String((partialEntry || {}).labelName || "").trim();

  if (!labelName) {
    return false;
  }

  const key = normalizeCalendarLabelNameKey_(labelName);
  const current = registry.entriesByNameKey[key] || createCalendarLabelRegistryEntry_(labelName);
  const next = Object.assign({}, current, partialEntry, {
    labelName: labelName,
    colorId: isBlank_(partialEntry.colorId) ? (current.colorId || "") : String(partialEntry.colorId).trim(),
    sampleEventTitle: isBlank_(partialEntry.sampleEventTitle) ? (current.sampleEventTitle || "") : String(partialEntry.sampleEventTitle).trim(),
    sampleDate: isBlank_(partialEntry.sampleDate) ? (current.sampleDate || "") : String(partialEntry.sampleDate).trim(),
    source: isBlank_(partialEntry.source) ? (current.source || "") : String(partialEntry.source).trim(),
    lastSyncedAt: new Date().toISOString()
  });

  const before = JSON.stringify(current);
  const after = JSON.stringify(next);
  registry.entriesByNameKey[key] = next;
  return before !== after;
}


// 設定ファイルにあるラベル名ぶんの空エントリを最低限そろえる。
function ensureConfiguredCalendarLabelEntries_(registry, labelNames) {
  let changed = false;

  (labelNames || []).forEach(function(labelName) {
    changed = upsertCalendarLabelRegistryEntry_(registry, {
      labelName: labelName,
      source: "config"
    }) || changed;
  });

  return changed;
}

// 設定ファイルから消えたラベルを保存済みレジストリから取り除く。
function pruneCalendarLabelRegistryEntries_(registry, labelNames) {
  const allowed = {};
  let changed = false;

  (labelNames || []).forEach(function(labelName) {
    const key = normalizeCalendarLabelNameKey_(labelName);

    if (key) {
      allowed[key] = true;
    }
  });

  Object.keys((registry || {}).entriesByNameKey || {}).forEach(function(nameKey) {
    if (allowed[nameKey]) {
      return;
    }

    delete registry.entriesByNameKey[nameKey];
    changed = true;
  });

  return changed;
}

// レジストリから lookup を組み立てる。
function buildCalendarLabelRegistryLookup_(registry) {
  const entriesByNameKey = {};
  const labelNamesByColorId = {};
  const collisions = [];
  let defaultLabelName = "";

  Object.keys((registry || {}).entriesByNameKey || {}).forEach(function(nameKey) {
    const entry = registry.entriesByNameKey[nameKey];

    if (!entry || !entry.labelName) {
      return;
    }

    entriesByNameKey[nameKey] = entry;

    if (isDefaultCalendarLabelName_(entry.labelName)) {
      defaultLabelName = entry.labelName;
    }

    if (entry.colorId) {
      const colorId = String(entry.colorId).trim();
      const existing = labelNamesByColorId[colorId];

      if (existing && existing !== entry.labelName) {
        collisions.push(colorId + ": " + existing + " / " + entry.labelName);
      } else {
        labelNamesByColorId[colorId] = entry.labelName;
      }
    }
  });

  return {
    entriesByNameKey: entriesByNameKey,
    labelNamesByColorId: labelNamesByColorId,
    defaultLabelName: defaultLabelName,
    collisions: collisions
  };
}

// イベントの colorId から表示ラベル名を解決する。
function resolveCalendarEventLabelName_(event, labelLookup) {
  if (!labelLookup) {
    return "";
  }

  const colorId = isBlank_(event.colorId) ? "" : String(event.colorId).trim();

  if (!colorId) {
    return labelLookup.defaultLabelName || "";
  }

  return labelLookup.labelNamesByColorId[colorId] || "";
}

// シード設定に合わせて sampleDate 周辺の探索期間を決める。
function buildCalendarLabelSeedSearchWindow_(sampleDate) {
  const center = isBlank_(sampleDate) ? normalizeToDayStart_(new Date()) : normalizeToDayStart_(sampleDate);
  const start = new Date(center);
  const end = new Date(center);

  start.setDate(start.getDate() - 30);
  end.setDate(end.getDate() + 30);
  end.setHours(23, 59, 59, 999);

  return {
    startTime: start,
    endTime: end
  };
}

// 検索に一致した候補の中から一番近い予定を選ぶ。
function pickBestCalendarLabelSeedMatch_(events, sampleDate) {
  if (!events || events.length === 0) {
    return null;
  }

  const targetTime = isBlank_(sampleDate)
    ? normalizeToDayStart_(new Date()).getTime()
    : normalizeToDayStart_(sampleDate).getTime();

  return events.slice().sort(function(a, b) {
    return Math.abs(a.startTime.getTime() - targetTime) - Math.abs(b.startTime.getTime() - targetTime);
  })[0];
}

// 1件のシード設定から labelName と colorId を同期する。
function syncCalendarLabelRegistryEntryFromSeed_(settings, registry, seed) {
  const matchedEvents = findCalendarEventsByTitle_(settings, seed.sampleEventTitle, {
    sampleDate: seed.sampleDate
  });
  const matchedEvent = pickBestCalendarLabelSeedMatch_(matchedEvents, seed.sampleDate);

  if (!matchedEvent) {
    Logger.log(
      "syncCalendarLabelRegistry_: サンプル予定が見つかりません。labelName=" +
      seed.labelName + ", sampleEventTitle=" + seed.sampleEventTitle
    );
    return false;
  }

  if (isBlank_(matchedEvent.colorId)) {
    Logger.log(
      "syncCalendarLabelRegistry_: サンプル予定から colorId を取得できませんでした。labelName=" +
      seed.labelName + ", sampleEventTitle=" + seed.sampleEventTitle
    );
    return false;
  }

  return upsertCalendarLabelRegistryEntry_(registry, {
    labelName: seed.labelName,
    colorId: matchedEvent.colorId,
    sampleEventTitle: seed.sampleEventTitle,
    sampleDate: seed.sampleDate,
    source: "seed"
  });
}

// 色をまだ覚えていないシードだけを返す。
function pickUnresolvedCalendarLabelSeeds_(registry, seeds) {
  return (seeds || []).filter(function(seed) {
    const entry = registry.entriesByNameKey[seed.labelNameKey];
    return !entry || isBlank_(entry.colorId);
  });
}

// Script Properties 上のレジストリを最新化して返す。
// options.force を true にすると，覚え済みのシードも取り直す。
function syncCalendarLabelRegistry_(settings, options) {
  settings = requireCalendarReminderSettings_(settings || getCalendarReminderSettings_(), "syncCalendarLabelRegistry_");
  options = options || {};

  const registry = getStoredCalendarLabelRegistry_();
  const seeds = getCalendarLabelRegistrySeeds_();
  const configuredLabelNames = getConfiguredCalendarLabelNames_();
  let changed = false;

  changed = pruneCalendarLabelRegistryEntries_(registry, configuredLabelNames) || changed;
  changed = ensureConfiguredCalendarLabelEntries_(registry, configuredLabelNames) || changed;

  // カレンダー検索は重いので，未解決のシードだけを対象にする。
  const pendingSeeds = options.force === true ? seeds : pickUnresolvedCalendarLabelSeeds_(registry, seeds);

  pendingSeeds.forEach(function(seed) {
    changed = syncCalendarLabelRegistryEntryFromSeed_(settings, registry, seed) || changed;
  });

  if (changed) {
    saveCalendarLabelRegistry_(registry);
  }

  return registry;
}
