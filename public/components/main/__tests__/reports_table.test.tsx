/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReportsTable } from '../reports_table';
import { isResourceSharingAvailable } from '../../utils/resource_sharing_service';
import httpClientMock from '../../../../test/httpMockClient';

jest.mock('../../utils/resource_sharing_service', () => ({
  isResourceSharingAvailable: jest.fn(),
  REPORT_INSTANCE_RESOURCE_TYPE: 'report-instance',
}));

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [8, 10, 13],
};

describe('<ReportsTable /> panel', () => {
  test('render component', () => {
    let reportsTableItems = [
      {
        id: '1',
        reportName: 'test report table item',
        type: 'Test type',
        sender: 'N/A',
        recipients: 'N/A',
        reportSource: 'Test report source',
        lastUpdated: 'test updated time',
        state: 'Created',
        url: 'Test url',
      },
    ];
    const { container } = render(
      <ReportsTable
        reportsTableItems={reportsTableItems}
        httpClient={httpClientMock}
        pagination={pagination}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('render empty component', async () => {
    const { container } = render(
      <ReportsTable
        reportsTableItems={[]}
        httpClient={httpClientMock}
        pagination={pagination}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('click on generate button', async () => {
    let reportsTableItems = [
      {
        id: '1',
        reportName: 'test report table item',
        type: 'Test type',
        sender: 'N/A',
        recipients: 'N/A',
        reportSource: 'Test report source',
        lastUpdated: 'test updated time',
        state: 'Created',
        url: 'Test url',
      },
    ];

    render(
      <ReportsTable
        reportsTableItems={reportsTableItems}
        httpClient={httpClientMock}
        pagination={pagination}
      />
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(6);
    });

    const buttons = screen.getAllByRole('button');
    await act(async () => {
      fireEvent.click(buttons[6]);
    });
  });
});

describe('<ReportsTable /> resource sharing Access column', () => {
  const reportsTableItems = [
    {
      id: 'instance-1',
      reportName: 'my report instance',
      type: 'Test type',
      sender: 'N/A',
      recipients: 'N/A',
      reportSource: 'Test report source',
      lastUpdated: 'test updated time',
      state: 'Created',
      url: 'Test url',
    },
  ];

  afterEach(() => (isResourceSharingAvailable as jest.Mock).mockReset());

  test('renders the Access column with a share-button marker when resource sharing is available', () => {
    (isResourceSharingAvailable as jest.Mock).mockReturnValue(true);
    const { container } = render(
      <ReportsTable
        reportsTableItems={reportsTableItems}
        httpClient={httpClientMock}
        pagination={pagination}
      />
    );
    const marker = container.querySelector('[data-resource-share-button]');
    expect(marker).not.toBeNull();
    expect(marker!.getAttribute('data-resource-id')).toBe('instance-1');
    expect(marker!.getAttribute('data-resource-type')).toBe('report-instance');
    expect(marker!.getAttribute('data-resource-name')).toBe(
      'my report instance'
    );
    expect(marker!.getAttribute('data-resource-share-display')).toBe('icon');
  });

  test('does not render the Access column when resource sharing is unavailable', () => {
    (isResourceSharingAvailable as jest.Mock).mockReturnValue(false);
    const { container } = render(
      <ReportsTable
        reportsTableItems={reportsTableItems}
        httpClient={httpClientMock}
        pagination={pagination}
      />
    );
    expect(container.querySelector('[data-resource-share-button]')).toBeNull();
  });
});
