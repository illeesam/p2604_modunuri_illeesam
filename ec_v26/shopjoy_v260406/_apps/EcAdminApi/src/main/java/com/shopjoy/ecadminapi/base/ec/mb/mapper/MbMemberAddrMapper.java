package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbMemberAddrMapper {

    MbMemberAddrDto.Item selectById(@Param("id") String id);

    List<MbMemberAddrDto.Item> selectList(MbMemberAddrDto.Request req);

    List<MbMemberAddrDto.Item> selectPageList(MbMemberAddrDto.Request req);

    long selectPageCount(MbMemberAddrDto.Request req);

    int updateSelective(MbMemberAddr entity);
}
