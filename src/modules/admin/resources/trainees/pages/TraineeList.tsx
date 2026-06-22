"use client";
import { useState } from "react";

export function TraineeList() {
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const [search, setSearch] = useState("");

    // const { data, isLoading } = useTraineesQuery({
    //   page: paginationModel.page + 1,
    //   perPage: paginationModel.pageSize,
    //   q: search || undefined,
    // });

    return <div>Stagiaire</div>;
}
