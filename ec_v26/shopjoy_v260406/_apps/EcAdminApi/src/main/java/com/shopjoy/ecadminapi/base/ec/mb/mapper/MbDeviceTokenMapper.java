package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbDeviceTokenMapper {

    MbDeviceTokenDto.Item selectById(@Param("id") String id);

    List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request req);

    List<MbDeviceTokenDto.Item> selectPageList(MbDeviceTokenDto.Request req);

    long selectPageCount(MbDeviceTokenDto.Request req);

    int updateSelective(MbDeviceToken entity);
}
