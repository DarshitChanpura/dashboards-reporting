/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uiSettingsService } from './settings_service';

/**
 * Resource types registered by the reports-scheduler backend plugin with the
 * security plugin's resource-sharing framework.
 */
export const REPORT_DEFINITION_RESOURCE_TYPE = 'report-definition';
export const REPORT_INSTANCE_RESOURCE_TYPE = 'report-instance';

/**
 * Resource types for which resource sharing is available on the given data
 * source (or the local cluster when no data source id is provided). Empty
 * when the security plugin is not installed, resource sharing is disabled on
 * that source, or no shareable types are registered there.
 */
export const getResourceSharingAvailableTypes = async (
  resourceDataSourceId?: string
): Promise<string[]> => {
  try {
    const http = uiSettingsService.getHttpClient();
    const query = resourceDataSourceId
      ? { dataSourceId: resourceDataSourceId }
      : {};
    // Global gate: resource sharing must be enabled on the selected data source.
    const info: any = await http.get('/api/v1/auth/dashboardsinfo', { query });
    if (!info?.resource_sharing_enabled) return [];
    // Per-type gate: the registered/protected shareable types on that source.
    const typesResp: any = await http.get('/api/resource/types', { query });
    const rawTypes = Array.isArray(typesResp)
      ? typesResp
      : (typesResp?.types ?? []);
    return rawTypes
      .map((entry: { type: string }) => entry?.type)
      .filter((type: string | undefined): type is string => Boolean(type));
  } catch (e) {
    return [];
  }
};
