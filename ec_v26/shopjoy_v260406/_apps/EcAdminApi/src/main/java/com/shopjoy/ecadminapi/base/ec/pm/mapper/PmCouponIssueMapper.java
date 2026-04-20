package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmCouponIssueMapper {

    PmCouponIssueDto selectById(@Param("id") String id);

    List<PmCouponIssueDto> selectList(@Param("p") Map<String, Object> p);

    List<PmCouponIssueDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmCouponIssue entity);
}
