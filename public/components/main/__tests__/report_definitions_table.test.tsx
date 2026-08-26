/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReportDefinitions } from '../report_definitions_table';
import { isResourceSharingAvailable } from '../../utils/resource_sharing_service';

jest.mock('../../utils/resource_sharing_service', () => ({
  isResourceSharingAvailable: jest.fn(),
  REPORT_DEFINITION_RESOURCE_TYPE: 'report-definition',
}));

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [8, 10, 13],
};

describe('<ReportDefinitions /> panel', () => {
  test('render component', () => {
    let reportDefinitionsTableContent = [
      {
        reportName: 'test report name',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
      {
        reportName: 'test report name 2',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
    ];
    const { container } = render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={reportDefinitionsTableContent}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('render empty table', () => {
    const { container } = render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={[]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('test click on report definition row', async () => {
    let reportDefinitionsTableContent = [
      {
        reportName: 'test report name',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
      {
        reportName: 'test report name 2',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
    ];

    render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={reportDefinitionsTableContent}
      />
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(3);
    });

    const buttons = screen.getAllByRole('button');
    await act(async () => {
      fireEvent.click(buttons[3]);
    });
  });
});

describe('<ReportDefinitions /> resource sharing Access column', () => {
  const content = [
    {
      id: 'definition-1',
      reportName: 'my report definition',
      type: 'Download',
      owner: 'davidcui',
      source: 'Dashboard',
      lastUpdated: 'test updated time',
      details: '',
      status: 'Created',
    },
  ];

  afterEach(() => (isResourceSharingAvailable as jest.Mock).mockReset());

  test('renders the Access column with a share-button marker when resource sharing is available', () => {
    (isResourceSharingAvailable as jest.Mock).mockReturnValue(true);
    const { container } = render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={content}
      />
    );
    const marker = container.querySelector('[data-resource-share-button]');
    expect(marker).not.toBeNull();
    expect(marker!.getAttribute('data-resource-id')).toBe('definition-1');
    expect(marker!.getAttribute('data-resource-type')).toBe(
      'report-definition'
    );
    expect(marker!.getAttribute('data-resource-name')).toBe(
      'my report definition'
    );
    expect(marker!.getAttribute('data-resource-share-display')).toBe('icon');
  });

  test('does not render the Access column when resource sharing is unavailable', () => {
    (isResourceSharingAvailable as jest.Mock).mockReturnValue(false);
    const { container } = render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={content}
      />
    );
    expect(container.querySelector('[data-resource-share-button]')).toBeNull();
  });
});
