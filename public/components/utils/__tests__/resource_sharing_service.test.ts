/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

jest.mock('../application_service', () => ({
  applicationService: { getApplication: jest.fn() },
}));

import {
  isResourceSharingAvailable,
  REPORT_INSTANCE_RESOURCE_TYPE,
} from '../resource_sharing_service';
import { applicationService } from '../application_service';

const mockGetApplication = applicationService.getApplication as jest.Mock;

const withResourceSharing = (resourceSharing?: Record<string, unknown>) =>
  mockGetApplication.mockReturnValue({
    capabilities: resourceSharing ? { resourceSharing } : {},
  });

describe('isResourceSharingAvailable', () => {
  afterEach(() => mockGetApplication.mockReset());

  it('returns false when getApplication has not been initialized', () => {
    mockGetApplication.mockReturnValue(undefined);
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('returns false when the resourceSharing capability is absent', () => {
    withResourceSharing();
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('returns false when resource sharing is disabled', () => {
    withResourceSharing({
      enabled: false,
      availableTypes: 'report-definition',
    });
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('returns false when the resource type is not in availableTypes', () => {
    withResourceSharing({
      enabled: true,
      availableTypes: 'workflow,anomaly-detector',
    });
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('defaults to the report-definition type and returns true when present', () => {
    withResourceSharing({
      enabled: true,
      availableTypes: 'report-definition,workflow',
    });
    expect(isResourceSharingAvailable()).toBe(true);
  });

  it('supports the report-instance type explicitly', () => {
    withResourceSharing({ enabled: true, availableTypes: 'report-instance' });
    expect(isResourceSharingAvailable(REPORT_INSTANCE_RESOURCE_TYPE)).toBe(
      true
    );
    expect(isResourceSharingAvailable()).toBe(false);
  });

  it('returns false and swallows errors when getApplication throws', () => {
    mockGetApplication.mockImplementation(() => {
      throw new Error('application not ready');
    });
    expect(isResourceSharingAvailable()).toBe(false);
  });
});
