package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface MbDeviceTokenMapper {

    MbDeviceTokenDto.Item selectById(@Param("id") String id);

    List<MbDeviceTokenDto.Item> selectList(Map<String, Object> p);

    List<MbDeviceTokenDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(MbDeviceToken entity);
}
