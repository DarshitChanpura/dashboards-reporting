/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { SecurityPluginStart } from '../../security-dashboards-plugin/public/types';

export interface ReportsDashboardsPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReportsDashboardsPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  securityDashboards?: SecurityPluginStart;
}
