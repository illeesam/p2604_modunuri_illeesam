package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;

import java.util.List;
import java.util.Optional;

/** PmVoucherIssue QueryDSL Custom Repository */
public interface QPmVoucherIssueRepository {

    Optional<PmVoucherIssueDto.Item> selectById(String voucherIssueId);

    List<PmVoucherIssueDto.Item> selectList(PmVoucherIssueDto.Request search);

    PmVoucherIssueDto.PageResponse selectPageList(PmVoucherIssueDto.Request search);

    int updateSelective(PmVoucherIssue entity);
}
