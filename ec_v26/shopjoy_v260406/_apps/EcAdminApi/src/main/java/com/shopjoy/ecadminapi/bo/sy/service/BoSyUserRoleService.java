package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRoleRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyUserRoleService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyUserRoleMapper syUserRoleMapper;
    private final SyUserRoleRepository syUserRoleRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyUserRoleDto> getRolesByUserId(String userId) {
        return syUserRoleMapper.selectByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<SyUserRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syUserRoleMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyUserRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syUserRoleMapper.selectPageList(p), syUserRoleMapper.selectPageCount(p),
                PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyUserRoleDto getById(String id) {
        SyUserRoleDto dto = syUserRoleMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyUserRole create(SyUserRole body) {
        String authId = SecurityUtil.getAuthUser().authId();
        body.setUserRoleId("UR" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(authId);
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(authId);
        body.setUpdDate(LocalDateTime.now());
        return syUserRoleRepository.save(body);
    }

    @Transactional
    public SyUserRoleDto update(String id, SyUserRole body) {
        String authId = SecurityUtil.getAuthUser().authId();
        SyUserRole entity = syUserRoleRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(authId);
        entity.setUpdDate(LocalDateTime.now());
        syUserRoleRepository.save(entity);
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyUserRole entity = syUserRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syUserRoleRepository.delete(entity);
        em.flush();
        if (syUserRoleRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    @Transactional
    public void saveList(List<SyUserRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUserRoleId() != null)
            .map(SyUserRole::getUserRoleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syUserRoleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyUserRole> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUserRoleId() != null)
            .toList();
        for (SyUserRole row : updateRows) {
            SyUserRole entity = syUserRoleRepository.findById(row.getUserRoleId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getUserRoleId()));
            VoUtil.voCopyExclude(row, entity, "userRoleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syUserRoleRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyUserRole> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyUserRole row : insertRows) {
            row.setUserRoleId("UR" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syUserRoleRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}