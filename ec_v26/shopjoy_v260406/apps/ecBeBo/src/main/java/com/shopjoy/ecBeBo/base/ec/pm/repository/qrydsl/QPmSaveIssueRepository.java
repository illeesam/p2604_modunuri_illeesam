package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;

import java.util.List;
import java.util.Optional;

/** PmSaveIssue QueryDSL Custom Repository */
public interface QPmSaveIssueRepository {

    Optional<PmSaveIssueDto.Item> selectById(String saveIssueId);

    List<PmSaveIssueDto.Item> selectList(PmSaveIssueDto.Request search);

    BasePage<PmSaveIssueDto.Item> selectPageData(PmSaveIssueDto.Request search);

    int updateSelective(PmSaveIssue entity);
}
