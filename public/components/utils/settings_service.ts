/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, IUiSettingsClient } from '../../../../../src/core/public';
import { SecurityPluginStart } from '../../../../security-dashboards-plugin/public/types';

let uiSettings: IUiSettingsClient;
let http: HttpStart;
let securityDashboards: SecurityPluginStart | undefined;

export const uiSettingsService = {
  init: (
    uiSettingsClient: IUiSettingsClient,
    httpClient: HttpStart,
    securityDashboardsStart?: SecurityPluginStart
  ) => {
    uiSettings = uiSettingsClient;
    http = httpClient;
    securityDashboards = securityDashboardsStart;
  },
  get: (key: string, defaultOverride?: any) => {
    return uiSettings?.get(key, defaultOverride) || '';
  },
  getSearchParams: function () {
    const rawTimeZone = this.get('dateFormat:tz');
    const timezone =
      !rawTimeZone || rawTimeZone === 'Browser'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : rawTimeZone;
    const dateFormat = this.get('dateFormat');
    const csvSeparator = this.get('csv:separator');
    const allowLeadingWildcards = this.get('query:allowLeadingWildcards');
    return {
      timezone,
      dateFormat,
      csvSeparator,
      allowLeadingWildcards,
    };
  },
  getHttpClient: () => http,
  // Optional: only set when security-dashboards-plugin is installed (see
  // plugin.ts start()). Presence alone doesn't guarantee its client-side
  // DOM-marker SPI is running -- use
  // securityDashboards.ui.isResourceSharingAvailable, which is itself gated
  // on that, rather than presence alone.
  getSecurityDashboards: () => securityDashboards,
};
