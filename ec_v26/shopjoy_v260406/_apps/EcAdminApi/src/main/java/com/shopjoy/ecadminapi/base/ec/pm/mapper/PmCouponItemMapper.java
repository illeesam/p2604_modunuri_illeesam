package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmCouponItemMapper {

    PmCouponItemDto.Item selectById(@Param("id") String id);

    List<PmCouponItemDto.Item> selectList(PmCouponItemDto.Request req);

    List<PmCouponItemDto.Item> selectPageList(PmCouponItemDto.Request req);

    long selectPageCount(PmCouponItemDto.Request req);

    int updateSelective(PmCouponItem entity);
}
