package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;

import java.util.List;
import java.util.Optional;

/** PmCouponIssue QueryDSL Custom Repository */
public interface QPmCouponIssueRepository {

    Optional<PmCouponIssueDto.Item> selectById(String issueId);

    List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request search);

    PmCouponIssueDto.PageResponse selectPageList(PmCouponIssueDto.Request search);

    int updateSelective(PmCouponIssue entity);
}
