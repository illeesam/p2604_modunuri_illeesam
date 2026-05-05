package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
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
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoSyUserService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyUserMapper syUserMapper;
    private final SyUserRepository syUserRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyUserDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syUserMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyUserDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syUserMapper.selectPageList(p), syUserMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyUserDto getById(String id) {
        SyUserDto dto = syUserMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyUser create(SyUser body) {
        body.setUserId("US" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public SyUserDto update(String id, SyUser body) {
        SyUser entity = syUserRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "userId^loginId^loginPwdHash^regBy^regDate^lastLogin^lastLoginDate^loginFailCnt");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyUser entity = syUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syUserRepository.delete(entity);
        em.flush();
        if (syUserRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    @Transactional
    public void saveList(List<SyUser> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUserId() != null)
            .map(SyUser::getUserId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syUserRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyUser> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUserId() != null)
            .toList();
        for (SyUser row : updateRows) {
            SyUser entity = syUserRepository.findById(row.getUserId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getUserId()));
            VoUtil.voCopyExclude(row, entity, "userId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syUserRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyUser> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyUser row : insertRows) {
            row.setUserId("US" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syUserRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}