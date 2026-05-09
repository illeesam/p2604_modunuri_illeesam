package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmCouponMapper {

    PmCouponDto.Item selectById(@Param("id") String id);

    List<PmCouponDto.Item> selectList(PmCouponDto.Request req);

    List<PmCouponDto.Item> selectPageList(PmCouponDto.Request req);

    long selectPageCount(PmCouponDto.Request req);

    int updateSelective(PmCoupon entity);
}
