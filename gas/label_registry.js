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
    calendarId: "",
    entriesByNameKey: {}
  };
}

// CALENDAR_BOOK を逆引きして，カレンダーIDから呼び名を探す。
function findCalendarBookNameById_(calendarId) {
  if (typeof CALENDAR_BOOK === "undefined" || !CALENDAR_BOOK) {
    return "";
  }

  const wanted = String(calendarId || "").trim();
  const names = Object.keys(CALENDAR_BOOK).filter(function(name) {
    return String(CALENDAR_BOOK[name] || "").trim() === wanted;
  });

  return names.length > 0 ? names[0] : "";
}

// config_labels.js から対象カレンダー用のプロファイルを取り出す。
// 引数には CALENDAR_BOOK の呼び名を渡す。カレンダーIDでも引ける。
// 見つからないときは旧形式の設定を探し，それも無ければ既定値へ落とす。
function getCalendarLabelProfile_(calendarKey) {
  const wantedCalendarId = isBlank_(calendarKey) ? "primary" : String(calendarKey).trim();

  if (typeof CALENDAR_LABEL_PROFILES !== "undefined" && CALENDAR_LABEL_PROFILES) {
    // 呼び名で引く。見つからなければ，IDから呼び名を逆引きして再試行する。
    const profileKey = CALENDAR_LABEL_PROFILES[wantedCalendarId]
      ? wantedCalendarId
      : findCalendarBookNameById_(wantedCalendarId);
    const profile = CALENDAR_LABEL_PROFILES[profileKey];

    if (profile) {
      return {
        calendarId: wantedCalendarId,
        labels: Array.isArray(profile.labels) ? profile.labels : [],
        seeds: Array.isArray(profile.seeds) ? profile.seeds : [],
        source: "profile"
      };
    }
  }

  // 旧形式（CALENDAR_REMINDER_LABELS / CALENDAR_LABEL_REGISTRY_SEEDS）との互換。
  const hasLegacyLabels = typeof CALENDAR_REMINDER_LABELS !== "undefined" && Array.isArray(CALENDAR_REMINDER_LABELS);
  const hasLegacySeeds = typeof CALENDAR_LABEL_REGISTRY_SEEDS !== "undefined" && Array.isArray(CALENDAR_LABEL_REGISTRY_SEEDS);

  if (hasLegacyLabels || hasLegacySeeds) {
    Logger.log(
      "getCalendarLabelProfile_: \"" + wantedCalendarId +
      "\" のプロファイルが無いため，旧形式の設定を使います。" +
      "config_labels.js の CALENDAR_LABEL_PROFILES へ移行してください。"
    );

    return {
      calendarId: wantedCalendarId,
      labels: hasLegacyLabels ? CALENDAR_REMINDER_LABELS : [],
      seeds: hasLegacySeeds ? CALENDAR_LABEL_REGISTRY_SEEDS : [],
      source: "legacy"
    };
  }

  const fallback = (typeof CALENDAR_LABEL_PROFILE_FALLBACK !== "undefined" && CALENDAR_LABEL_PROFILE_FALLBACK)
    ? CALENDAR_LABEL_PROFILE_FALLBACK
    : { labels: [], seeds: [] };

  Logger.log(
    "getCalendarLabelProfile_: \"" + wantedCalendarId +
    "\" のプロファイルが config_labels.js の CALENDAR_LABEL_PROFILES にありません。" +
    "既定値（色なしを「デフォルト」として扱う）で動作します。"
  );

  return {
    calendarId: wantedCalendarId,
    labels: Array.isArray(fallback.labels) ? fallback.labels : [],
    seeds: Array.isArray(fallback.seeds) ? fallback.seeds : [],
    source: "fallback"
  };
}

// 対象カレンダーのシード設定を読みやすい形へ整える。
function getCalendarLabelRegistrySeeds_(calendarKey) {
  const profile = getCalendarLabelProfile_(calendarKey);

  return profile.seeds
    .map(function(seed) {
      if (!seed) {
        return null;
      }

      // 文字列だけを書いた場合は，ラベル名として扱う。
      const normalizedSeed = (typeof seed === "string") ? { labelName: seed } : seed;
      const labelName = String(normalizedSeed.labelName || "").trim();

      // 見本の件名はラベル名と同じことがほとんどなので，
      // 省略されたらラベル名をそのまま使う。
      const sampleEventTitle = isBlank_(normalizedSeed.sampleEventTitle)
        ? labelName
        : String(normalizedSeed.sampleEventTitle).trim();
      const sampleDate = isBlank_(normalizedSeed.sampleDate) ? "" : String(normalizedSeed.sampleDate).trim();

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


// 通知対象にするラベル名の一覧を重複なしで返す。
// labels を書いていればそれを使い，省略時は seeds のラベル（＋デフォルト）を使う。
// targetEventLabels: true のときの絞り込みに使われる。
function getConfiguredCalendarLabelNames_(calendarKey) {
  const profile = getCalendarLabelProfile_(calendarKey);

  // labels を明示したら，それだけを通知対象にする。
  if (Array.isArray(profile.labels) && profile.labels.length > 0) {
    return dedupeCalendarLabelNames_(profile.labels);
  }

  // 省略時は seeds のラベル名がそのまま対象。
  // 色なしの予定を拾えるよう「デフォルト」も自動で足す。
  return dedupeCalendarLabelNames_(
    getCalendarLabelRegistrySeeds_(calendarKey).map(function(seed) {
      return seed.labelName;
    }).concat(["デフォルト"])
  );
}

// レジストリへ登録しておくラベル名の一覧を返す。
// 通知対象でなくても，色を覚えておけば通知本文へ名前を出せる。
function getRegisteredCalendarLabelNames_(calendarKey) {
  return dedupeCalendarLabelNames_(
    getConfiguredCalendarLabelNames_(calendarKey).concat(
      getCalendarLabelRegistrySeeds_(calendarKey).map(function(seed) {
        return seed.labelName;
      })
    )
  );
}

// ラベル名一覧から空要素と重複を取り除く。
function dedupeCalendarLabelNames_(labelNames) {
  const result = [];
  const seen = {};

  normalizeStringList_(labelNames).forEach(function(labelName) {
    const key = normalizeCalendarLabelNameKey_(labelName);

    if (!key || seen[key]) {
      return;
    }

    seen[key] = true;
    result.push(labelName);
  });

  return result;
}

// Script Properties から保存済みレジストリを読む。
// expectedCalendarId を渡すと，別カレンダーで覚えた色を引き継がないよう空へ戻す。
function getStoredCalendarLabelRegistry_(expectedCalendarId) {
  const raw = PropertiesService.getScriptProperties().getProperty(CALENDAR_LABEL_REGISTRY_PROPERTY_KEY);
  const wantedCalendarId = isBlank_(expectedCalendarId) ? "" : String(expectedCalendarId).trim();

  if (isBlank_(raw)) {
    const empty = createEmptyCalendarLabelRegistry_();
    empty.calendarId = wantedCalendarId;
    return empty;
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    Logger.log("getStoredCalendarLabelRegistry_: 保存済みJSONの解析に失敗したため空レジストリへ戻します。reason=" + error.message);
    const broken = createEmptyCalendarLabelRegistry_();
    broken.calendarId = wantedCalendarId;
    return broken;
  }

  const registry = createEmptyCalendarLabelRegistry_();

  registry.version = parsed.version || 1;
  registry.updatedAt = String(parsed.updatedAt || "");
  registry.calendarId = String(parsed.calendarId || "");
  registry.entriesByNameKey = parsed.entriesByNameKey || {};

  // 色番号はカレンダーごとの意味しか持たない。
  // 対象カレンダーが変わったら覚え直させる。
  if (wantedCalendarId && registry.calendarId !== wantedCalendarId) {
    Logger.log(
      "getStoredCalendarLabelRegistry_: 対象カレンダーが変わったためレジストリを破棄します。" +
      "storedCalendarId=" + (registry.calendarId || "(未記録)") +
      ", targetCalendarId=" + wantedCalendarId
    );

    const reset = createEmptyCalendarLabelRegistry_();
    reset.calendarId = wantedCalendarId;

    // 破棄したことを呼び出し側へ伝える。
    // これが無いと「保存が必要」と判断できず，古い色が残ったままになる。
    reset.discardedCalendarId = registry.calendarId || "";
    return reset;
  }

  return registry;
}

// Script Properties へレジストリを書き戻す。
function saveCalendarLabelRegistry_(registry) {
  registry.updatedAt = new Date().toISOString();
  registry.calendarId = isBlank_(registry.calendarId) ? "" : String(registry.calendarId).trim();

  // discardedCalendarId は実行中だけの目印なので保存対象から外す。
  PropertiesService.getScriptProperties().setProperty(
    CALENDAR_LABEL_REGISTRY_PROPERTY_KEY,
    JSON.stringify({
      version: registry.version,
      updatedAt: registry.updatedAt,
      calendarId: registry.calendarId,
      entriesByNameKey: registry.entriesByNameKey
    })
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
    eventLabelId: "",
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
    eventLabelId: isBlank_(partialEntry.eventLabelId) ? (current.eventLabelId || "") : String(partialEntry.eventLabelId).trim(),
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
  const labelNamesByEventLabelId = {};
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

    if (entry.eventLabelId) {
      labelNamesByEventLabelId[String(entry.eventLabelId).trim()] = entry.labelName;
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
    labelNamesByEventLabelId: labelNamesByEventLabelId,
    defaultLabelName: defaultLabelName,
    collisions: collisions
  };
}

// イベントの colorId から表示ラベル名を解決する。
function resolveCalendarEventLabelName_(event, labelLookup) {
  if (!labelLookup) {
    return "";
  }

  // 名前付きラベルは colorId を持たないため，先に eventLabelId で照合する。
  const eventLabelId = isBlank_(event.eventLabelId) ? "" : String(event.eventLabelId).trim();

  if (eventLabelId) {
    const nameByLabelId = (labelLookup.labelNamesByEventLabelId || {})[eventLabelId];

    if (nameByLabelId) {
      return nameByLabelId;
    }
  }

  const colorId = isBlank_(event.colorId) ? "" : String(event.colorId).trim();

  if (!colorId) {
    return eventLabelId ? "" : (labelLookup.defaultLabelName || "");
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

  // 名前付きラベルの予定は colorId を持たないので，どちらか片方あればよい。
  if (isBlank_(matchedEvent.colorId) && isBlank_(matchedEvent.eventLabelId)) {
    Logger.log(
      "syncCalendarLabelRegistry_: サンプル予定から色を取得できませんでした。labelName=" +
      seed.labelName + ", sampleEventTitle=" + seed.sampleEventTitle +
      "。予定に色かラベルが付いているか確認してください。"
    );
    return false;
  }

  return upsertCalendarLabelRegistryEntry_(registry, {
    labelName: seed.labelName,
    colorId: matchedEvent.colorId,
    eventLabelId: matchedEvent.eventLabelId,
    sampleEventTitle: seed.sampleEventTitle,
    sampleDate: seed.sampleDate,
    source: "seed"
  });
}

// 色をまだ覚えていないシードだけを返す。
function pickUnresolvedCalendarLabelSeeds_(registry, seeds) {
  return (seeds || []).filter(function(seed) {
    const entry = registry.entriesByNameKey[seed.labelNameKey];
    return !entry || (isBlank_(entry.colorId) && isBlank_(entry.eventLabelId));
  });
}

// Script Properties 上のレジストリを最新化して返す。
// options.force を true にすると，覚え済みのシードも取り直す。
function syncCalendarLabelRegistry_(settings, options) {
  settings = requireCalendarReminderSettings_(settings || getCalendarReminderSettings_(), "syncCalendarLabelRegistry_");
  options = options || {};

  // プロファイルは呼び名で引き，レジストリは実際のカレンダーIDで保存する。
  const targetCalendarKey = getTargetCalendarProfileKey_(settings);
  const targetCalendarId = getTargetCalendarId_(settings);
  const registry = getStoredCalendarLabelRegistry_(targetCalendarId);
  const seeds = getCalendarLabelRegistrySeeds_(targetCalendarKey);
  const configuredLabelNames = getRegisteredCalendarLabelNames_(targetCalendarKey);

  // getStoredCalendarLabelRegistry_ は破棄後の registry へ既に targetCalendarId を
  // 入れて返す。そのため calendarId の比較では変更を検知できない。
  // 破棄が起きたかどうかと，未記録かどうかで判断する。
  let changed = !isBlank_(registry.discardedCalendarId) || isBlank_(registry.calendarId);

  registry.calendarId = targetCalendarId;
  delete registry.discardedCalendarId;

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
