package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface MbMemberRoleMapper {

    MbMemberRoleDto.Item selectById(@Param("id") String id);

    List<MbMemberRoleDto.Item> selectList(Map<String, Object> p);

    List<MbMemberRoleDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(MbMemberRole entity);
}
