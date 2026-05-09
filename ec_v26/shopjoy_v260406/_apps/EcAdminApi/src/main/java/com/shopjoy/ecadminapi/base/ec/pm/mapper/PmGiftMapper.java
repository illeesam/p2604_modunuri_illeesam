package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmGiftMapper {

    PmGiftDto.Item selectById(@Param("id") String id);

    List<PmGiftDto.Item> selectList(PmGiftDto.Request req);

    List<PmGiftDto.Item> selectPageList(PmGiftDto.Request req);

    long selectPageCount(PmGiftDto.Request req);

    int updateSelective(PmGift entity);
}
