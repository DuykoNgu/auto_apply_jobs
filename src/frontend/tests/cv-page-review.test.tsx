import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { experience, profile, readyCv, renderPage, respondWith, summary } from './cv-test-utils';

describe('CvPage review list', () => {
  it('shows extracted fields and counts the ones to review', async () => {
    respondWith({
      '/cvs': { body: [{ ...summary, status: 'NEEDS_REVIEW' }] },
      '/cvs/cv-1': { body: { ...summary, status: 'NEEDS_REVIEW', facts: [profile, experience] } },
    });
    renderPage();
    expect(await screen.findByText('1 chỗ cần bạn xem lại')).toBeInTheDocument();
    expect(screen.getAllByText('An Nguyen').length).toBeGreaterThan(0);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('groups entries by section and shows the organization of each entry', async () => {
    const cv = { ...summary, status: 'READY', originalFileType: 'docx' };
    const school = (id: string, title: string, organization: string) => ({
      ...profile,
      id,
      kind: 'EDUCATION',
      title,
      organization,
      body: title,
    });
    respondWith({
      '/cvs': { body: [cv] },
      '/cvs/cv-1': {
        body: {
          ...cv,
          facts: [
            profile,
            { ...experience, id: 'f2', confidence: 0.9, needsReview: false },
            school('f3', 'Software Engineering', 'HUST'),
            school('f4', 'AI Bootcamp', 'FPT Academy'),
          ],
        },
      },
    });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('#cvList')).not.toBeNull());
    const list = within(container.querySelector('#cvList') as HTMLElement);
    expect(list.getByRole('heading', { name: /Học vấn/ })).toHaveTextContent('2 mục');
    expect(list.getByRole('heading', { name: /Kinh nghiệm/ })).toBeInTheDocument();
    expect(list.getByText('HUST')).toBeInTheDocument();
    expect(list.getByText('FPT Academy')).toBeInTheDocument();
  });

  it('shows confirm and edit actions inline for the selected entry, without a detail popup', async () => {
    const cv = { ...summary, status: 'NEEDS_REVIEW', originalFileType: 'docx' };
    respondWith({ '/cvs': { body: [cv] }, '/cvs/cv-1': { body: { ...cv, facts: [profile, experience] } } });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('#cvList')).not.toBeNull());
    const list = within(container.querySelector('#cvList') as HTMLElement);
    expect(list.queryByRole('button', { name: 'Sửa' })).toBeNull();

    fireEvent.click(list.getByText('Intern - ABC'));
    expect(list.getByRole('button', { name: 'Đúng' })).toBeInTheDocument();
    expect(list.getByRole('button', { name: 'Sửa' })).toBeInTheDocument();
    expect(screen.queryByText('Trong CV gốc')).toBeNull();

    fireEvent.click(list.getByRole('button', { name: 'Đúng' }));
    expect(await list.findByText('đã xác nhận')).toBeInTheDocument();
    expect(list.queryByRole('button', { name: 'Đúng' })).toBeNull();
  });

  it('shows only the edit action for an entry the AI is sure about', async () => {
    const cv = { ...summary, status: 'READY', originalFileType: 'docx' };
    respondWith({ '/cvs': { body: [cv] }, '/cvs/cv-1': { body: { ...cv, facts: [profile] } } });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('#cvList')).not.toBeNull());
    const list = within(container.querySelector('#cvList') as HTMLElement);
    fireEvent.click(list.getByText('An Nguyen'));
    expect(list.getByRole('button', { name: 'Sửa' })).toBeInTheDocument();
    expect(list.queryByRole('button', { name: 'Đúng' })).toBeNull();
  });

  it('rebuilds the paper from extracted facts for DOCX files', async () => {
    const cv = readyCv('docx');
    respondWith({ '/cvs': { body: [cv] }, '/cvs/cv-1': { body: { ...cv, facts: [profile] } } });
    const { container } = renderPage();
    expect(await screen.findByText('Backend Developer')).toBeInTheDocument();
    expect(screen.queryByTestId('original-pdf')).toBeNull();
  });

  it('renders the rebuilt paper of a DOCX with one bullet per • mark', async () => {
    const cv = { ...summary, status: 'READY', originalFileType: 'docx' };
    const project = {
      ...experience,
      id: 'f9',
      kind: 'PROJECT',
      title: 'Blockchain app',
      confidence: 0.99,
      needsReview: false,
      body: 'Blockchain app\n10/2025 - 06/2026 Project Manager •Built PoA consensus •Built the dashboard',
    };
    respondWith({ '/cvs': { body: [cv] }, '/cvs/cv-1': { body: { ...cv, facts: [profile, project] } } });
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('#cvPaper')).not.toBeNull());
    const paper = within(container.querySelector('#cvPaper') as HTMLElement);
    expect(paper.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Built PoA consensus',
      'Built the dashboard',
    ]);
  });
});
