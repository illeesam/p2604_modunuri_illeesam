package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface PmGiftMapper {

    PmGiftDto.Item selectById(@Param("id") String id);

    List<PmGiftDto.Item> selectList(Map<String, Object> p);

    List<PmGiftDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(PmGift entity);
}
