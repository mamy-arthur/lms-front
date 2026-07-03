'use client';
import { useState } from 'react';

export function ReportList() {
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // const { data, isLoading } = useReportsQuery({
  //   page: paginationModel.page + 1,
  //   perPage: paginationModel.pageSize,
  // });

  return <div>Report list</div>;
}
