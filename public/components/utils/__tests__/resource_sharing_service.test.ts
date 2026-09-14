/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

jest.mock('../settings_service', () => ({
  uiSettingsService: {
    getHttpClient: jest.fn(),
    getSecurityDashboards: jest.fn(),
  },
}));

import {
  getResourceSharingAvailableTypes,
  REPORT_DEFINITION_RESOURCE_TYPE,
  REPORT_INSTANCE_RESOURCE_TYPE,
} from '../resource_sharing_service';
import { uiSettingsService } from '../settings_service';

const mockGetHttpClient = uiSettingsService.getHttpClient as jest.Mock;
const mockGetSecurityDashboards =
  uiSettingsService.getSecurityDashboards as jest.Mock;

const withHttpResponses = (
  dashboardsInfo: unknown,
  resourceTypes?: unknown
): jest.Mock => {
  const get = jest.fn((path: string) => {
    if (path === '/api/v1/auth/resource_sharing_enabled') {
      return Promise.resolve(dashboardsInfo);
    }
    if (path === '/api/resource/types') {
      return Promise.resolve(resourceTypes);
    }
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
  mockGetHttpClient.mockReturnValue({ get });
  return get;
};

// By default, security-dashboards-plugin's local-SPI check confirms every
// type it is asked about. Individual tests override this per case.
const mockSecurityDashboards = (
  spiConfirms: (type: string) => boolean = () => true
) => {
  mockGetSecurityDashboards.mockReturnValue({
    ui: {
      isResourceSharingAvailable: (type: string) =>
        Promise.resolve(spiConfirms(type)),
    },
  });
};

describe('getResourceSharingAvailableTypes', () => {
  beforeEach(() => mockSecurityDashboards());

  afterEach(() => {
    mockGetHttpClient.mockReset();
    mockGetSecurityDashboards.mockReset();
  });

  it('returns [] when the http client has not been initialized', async () => {
    mockGetHttpClient.mockReturnValue(undefined);
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([]);
  });

  it('returns [] when resource sharing is disabled on the source', async () => {
    withHttpResponses({ enabled: false });
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([]);
  });

  it('returns [] when the resource_sharing_enabled request fails', async () => {
    mockGetHttpClient.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('boom')),
    });
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([]);
  });

  it('returns the registered types when resource sharing is enabled and the local SPI confirms each one', async () => {
    withHttpResponses(
      { enabled: true },
      {
        types: [
          { type: REPORT_DEFINITION_RESOURCE_TYPE },
          { type: REPORT_INSTANCE_RESOURCE_TYPE },
        ],
      }
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([
      'report-definition',
      'report-instance',
    ]);
  });

  it('supports a bare-array types response and drops malformed entries', async () => {
    withHttpResponses({ enabled: true }, [
      { type: REPORT_DEFINITION_RESOURCE_TYPE },
      {},
    ]);
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([
      'report-definition',
    ]);
  });

  it('forwards the selected data source id to both routes', async () => {
    const get = withHttpResponses({ enabled: true }, { types: [] });
    await getResourceSharingAvailableTypes('ds-1');
    expect(get).toHaveBeenCalledWith('/api/v1/auth/resource_sharing_enabled', {
      query: { dataSourceId: 'ds-1' },
    });
    expect(get).toHaveBeenCalledWith('/api/resource/types', {
      query: { dataSourceId: 'ds-1' },
    });
  });

  it('sends an empty query when no data source id is given', async () => {
    const get = withHttpResponses({ enabled: true }, { types: [] });
    await getResourceSharingAvailableTypes();
    expect(get).toHaveBeenCalledWith('/api/v1/auth/resource_sharing_enabled', {
      query: {},
    });
  });

  it('returns [] without probing when security-dashboards-plugin is not installed', async () => {
    mockGetSecurityDashboards.mockReturnValue(undefined);
    const get = withHttpResponses(
      { enabled: true },
      { types: [{ type: REPORT_DEFINITION_RESOURCE_TYPE }] }
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it('drops a type that the backend reports as registered but the local SPI does not confirm', async () => {
    // Simulates: local cluster has resource sharing disabled (so the SPI
    // never started) while the selected data source reports it enabled.
    mockSecurityDashboards((type) => type === REPORT_INSTANCE_RESOURCE_TYPE);
    withHttpResponses(
      { enabled: true },
      {
        types: [
          { type: REPORT_DEFINITION_RESOURCE_TYPE },
          { type: REPORT_INSTANCE_RESOURCE_TYPE },
        ],
      }
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([
      REPORT_INSTANCE_RESOURCE_TYPE,
    ]);
  });

  it('drops a type when the local SPI confirmation throws', async () => {
    mockGetSecurityDashboards.mockReturnValue({
      ui: {
        isResourceSharingAvailable: () => Promise.reject(new Error('boom')),
      },
    });
    withHttpResponses(
      { enabled: true },
      { types: [{ type: REPORT_DEFINITION_RESOURCE_TYPE }] }
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual([]);
  });
});
