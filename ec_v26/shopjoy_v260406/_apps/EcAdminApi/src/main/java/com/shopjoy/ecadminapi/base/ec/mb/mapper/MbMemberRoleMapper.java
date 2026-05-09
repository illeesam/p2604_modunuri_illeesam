package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbMemberRoleMapper {

    MbMemberRoleDto.Item selectById(@Param("id") String id);

    List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request req);

    List<MbMemberRoleDto.Item> selectPageList(MbMemberRoleDto.Request req);

    long selectPageCount(MbMemberRoleDto.Request req);

    int updateSelective(MbMemberRole entity);
}
