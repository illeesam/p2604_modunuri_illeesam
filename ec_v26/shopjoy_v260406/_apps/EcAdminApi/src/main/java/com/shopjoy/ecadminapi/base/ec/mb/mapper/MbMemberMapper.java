package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbMemberMapper {

    MbMemberDto.Item selectById(@Param("id") String id);

    List<MbMemberDto.Item> selectList(MbMemberDto.Request req);

    List<MbMemberDto.Item> selectPageList(MbMemberDto.Request req);

    long selectPageCount(MbMemberDto.Request req);

    int updateSelective(MbMember entity);
}
