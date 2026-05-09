package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmGiftCondMapper {

    PmGiftCondDto.Item selectById(@Param("id") String id);

    List<PmGiftCondDto.Item> selectList(PmGiftCondDto.Request req);

    List<PmGiftCondDto.Item> selectPageList(PmGiftCondDto.Request req);

    long selectPageCount(PmGiftCondDto.Request req);

    int updateSelective(PmGiftCond entity);
}
