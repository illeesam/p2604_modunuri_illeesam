package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;

import java.util.List;
import java.util.Optional;

/** PmSaveIssue QueryDSL Custom Repository */
public interface QPmSaveIssueRepository {

    Optional<PmSaveIssueDto.Item> selectById(String saveIssueId);

    List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request search);

    PmSaveIssueDto.PageResponse selectPageList(PmSaveIssueDto.Request search);

    int updateSelective(PmSaveIssue entity);
}
