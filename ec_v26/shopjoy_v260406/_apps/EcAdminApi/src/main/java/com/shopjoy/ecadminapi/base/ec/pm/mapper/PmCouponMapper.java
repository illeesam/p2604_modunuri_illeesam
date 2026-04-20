package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmCouponMapper {

    PmCouponDto selectById(@Param("id") String id);

    List<PmCouponDto> selectList(@Param("p") Map<String, Object> p);

    List<PmCouponDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmCoupon entity);
}
