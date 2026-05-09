package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmCouponIssueMapper {

    PmCouponIssueDto.Item selectById(@Param("id") String id);

    List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request req);

    List<PmCouponIssueDto.Item> selectPageList(PmCouponIssueDto.Request req);

    long selectPageCount(PmCouponIssueDto.Request req);

    int updateSelective(PmCouponIssue entity);
}
